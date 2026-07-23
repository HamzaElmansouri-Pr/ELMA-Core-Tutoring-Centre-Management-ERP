<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use Illuminate\Http\Request;
use App\Actions\Finance\RecordPaymentAction;
use App\Actions\Finance\RecordRefundAction;
use App\Http\Resources\PaymentResource;

class PaymentController extends Controller
{
    public function store(Request $request, Invoice $invoice, RecordPaymentAction $paymentAction, RecordRefundAction $refundAction)
    {
        $data = $request->validate([
            'amount_centimes' => 'required|integer|min:1',
            'type' => 'required|in:payment,refund',
            'payment_method' => 'nullable|string',
            'reason' => 'required_if:type,refund|nullable|string',
        ]);

        try {
            if ($data['type'] === 'refund') {
                $payment = $refundAction->execute($invoice, $data['amount_centimes'], $data['reason']);
            } else {
                $payment = $paymentAction->execute($invoice, $data['amount_centimes'], $data['payment_method'] ?? 'cash');
            }

            return new PaymentResource($payment->load('invoice'));
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }
}
