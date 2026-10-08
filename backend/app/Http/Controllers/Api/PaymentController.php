<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\Student;
use App\Actions\Finance\RecordPaymentAction;
use App\Actions\Finance\RecordRefundAction;
use App\Http\Requests\StoreBatchPaymentRequest;
use App\Http\Requests\StorePaymentRequest;
use App\Http\Requests\StoreRefundRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Barryvdh\DomPDF\Facade\Pdf;

class PaymentController extends Controller
{
    /**
     * Get a list of all payments.
     */
    public function index(Request $request)
    {
        $query = Payment::with([
            'invoice:id,student_id,month,year,total_amount_centimes,paid_amount_centimes,balance_due_centimes,status',
            'invoice.student:id,first_name,last_name,parent_phone',
            'invoice.items:id,invoice_id,school_class_id,amount_centimes',
            'invoice.items.schoolClass:id,name,subject_id,teacher_id,price_centimes',
            'invoice.items.schoolClass.subject:id,name'
        ]);

        if ($request->filled('search')) {
            $search = trim($request->input('search'));
            $query->where(function ($q) use ($search) {
                $q->where('id', 'like', "%{$search}%")
                  ->orWhere('payment_method', 'like', "%{$search}%")
                  ->orWhereHas('invoice', function ($iq) use ($search) {
                      $iq->where('id', 'like', "%{$search}%")
                         ->orWhereHas('student', function ($sq) use ($search) {
                             $sq->where('first_name', 'like', "%{$search}%")
                                ->orWhere('last_name', 'like', "%{$search}%")
                                ->orWhere('parent_phone', 'like', "%{$search}%");
                         });
                  });
            });
        }

        $perPage = (int) $request->input('per_page', 15);
        if ($perPage < 1 || $perPage > 100) {
            $perPage = 15;
        }

        $paginated = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json($paginated);
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
    public function store(StoreBatchPaymentRequest $request, RecordPaymentAction $recordPaymentAction)
    {
        $validated = $request->validated();

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

                    if ($invoiceData['amount_centimes'] > 0) {
                        $payments[] = $recordPaymentAction->execute(
                            $invoice,
                            $invoiceData['amount_centimes'],
                            $validated['payment_method'],
                            $discountCentimes,
                            $discountReason,
                        );
                    } elseif ($discountCentimes > 0) {
                        $this->applyDiscount($invoice, $discountCentimes, $discountReason);
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

    public function recordInvoicePayment(
        StorePaymentRequest $request,
        Invoice $invoice,
        RecordPaymentAction $recordPaymentAction,
    ) {
        try {
            $payment = $recordPaymentAction->execute(
                $invoice,
                $request->integer('amount_centimes'),
                $request->string('payment_method')->toString(),
            );
        } catch (\InvalidArgumentException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        return response()->json(['data' => $payment], 201);
    }

    public function refund(
        StoreRefundRequest $request,
        Invoice $invoice,
        RecordRefundAction $recordRefundAction,
    ) {
        try {
            $refund = $recordRefundAction->execute(
                $invoice,
                $request->integer('amount_centimes'),
                $request->string('reason')->toString(),
            );
        } catch (\InvalidArgumentException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        return response()->json(['data' => $refund], 201);
    }

    private function applyDiscount(Invoice $invoice, int $discountCentimes, ?string $reason): void
    {
        $invoice = Invoice::query()->lockForUpdate()->findOrFail($invoice->id);
        $maximumDiscount = $invoice->total_amount_centimes - $invoice->paid_amount_centimes;

        if ($discountCentimes > $maximumDiscount) {
            throw new \InvalidArgumentException('Discount cannot exceed the unpaid invoice amount.');
        }

        $invoice->update([
            'discount_centimes' => $discountCentimes,
            'discount_reason' => $reason,
            'status' => $discountCentimes + $invoice->paid_amount_centimes >= $invoice->total_amount_centimes
                ? 'paid'
                : 'partial',
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
