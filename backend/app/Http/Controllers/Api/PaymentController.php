<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\Student;
use App\Actions\Finance\RecordPaymentAction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Barryvdh\DomPDF\Facade\Pdf;

class PaymentController extends Controller
{
    /**
     * Get a list of all payments.
     */
    public function index()
    {
        $payments = Payment::with(['invoice.student', 'invoice.items.schoolClass.subject'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['data' => $payments]);
    }

    /**
     * Get unpaid or partially paid invoices for a student.
     */
    public function getStudentInvoices(int $studentId)
    {
        $invoices = Invoice::with(['items.schoolClass.subject'])
            ->where('student_id', $studentId)
            ->whereIn('status', ['unpaid', 'partial'])
            ->get();

        return response()->json($invoices);
    }

    /**
     * Process a payment for one or multiple invoices.
     */
    public function store(Request $request, RecordPaymentAction $recordPaymentAction)
    {
        $validated = $request->validate([
            'student_id' => 'required|exists:students,id',
            'invoices' => 'required|array',
            'invoices.*.invoice_id' => 'required|exists:invoices,id',
            'invoices.*.amount_centimes' => 'required|integer|min:0',
            'invoices.*.discount_centimes' => 'nullable|integer|min:0',
            'invoices.*.discount_reason' => 'nullable|string',
            'payment_method' => 'required|string',
        ]);

        $payments = [];

        try {
            DB::transaction(function () use ($validated, $recordPaymentAction, &$payments) {
                foreach ($validated['invoices'] as $invoiceData) {
                if ($invoiceData['amount_centimes'] <= 0 && empty($invoiceData['discount_centimes'])) {
                    continue;
                }

                $invoice = Invoice::where('id', $invoiceData['invoice_id'])
                    ->where('student_id', $validated['student_id'])
                    ->firstOrFail();

                $discountCentimes = $invoiceData['discount_centimes'] ?? null;
                $discountReason = $invoiceData['discount_reason'] ?? null;
                
                // If there's an amount, process payment. If it's just a discount, we can apply it.
                if ($invoiceData['amount_centimes'] > 0) {
                    $payment = $recordPaymentAction->execute(
                        $invoice,
                        $invoiceData['amount_centimes'],
                        $validated['payment_method'],
                        $discountCentimes,
                        $discountReason
                    );
                    $payments[] = $payment;
                } else if ($discountCentimes > 0) {
                    // Only applying a discount without any payment
                    $invoice->discount_centimes = $discountCentimes;
                    if ($discountReason !== null) {
                        $invoice->discount_reason = $discountReason;
                    }
                    $invoice->save();
                    
                    // Update status if discount covers the entire balance
                    $newBalanceDue = $invoice->total_amount_centimes - $invoice->discount_centimes - $invoice->paid_amount_centimes;
                    if ($newBalanceDue <= 0) {
                        $invoice->status = 'paid';
                        $invoice->save();
                    }
                }
                }
            });
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'message' => 'Payment(s) processed successfully.',
            'payments' => $payments,
            'primary_payment_id' => count($payments) > 0 ? $payments[0]->id : null,
        ]);
    }

    /**
     * Download a PDF receipt for a specific payment.
     */
    public function downloadReceipt(int $paymentId)
    {
        $payment = Payment::with(['invoice.student', 'invoice.items.schoolClass.subject'])
            ->findOrFail($paymentId);

        $pdf = Pdf::loadView('pdf.receipt', ['payment' => $payment]);

        return $pdf->download('receipt-' . $payment->id . '.pdf');
    }
}
