<?php

namespace App\Actions\Finance;

use App\Models\Invoice;
use App\Models\Payment;
use App\Models\PaymentAllocation;
use Illuminate\Support\Facades\DB;
use Exception;

class RecordPaymentAction
{
    public function execute(Invoice $invoice, int $amountCentimes, string $paymentMethod = 'cash'): Payment
    {
        if ($amountCentimes <= 0) {
            throw new Exception("Payment amount must be greater than zero.");
        }

        $balanceDue = $invoice->total_amount_centimes - $invoice->paid_amount_centimes;

        if ($amountCentimes > $balanceDue) {
            throw new Exception("Payment amount cannot exceed the balance due.");
        }

        return DB::transaction(function () use ($invoice, $amountCentimes, $paymentMethod) {
            $payment = Payment::create([
                'invoice_id' => $invoice->id,
                'amount_centimes' => $amountCentimes,
                'type' => 'payment',
                'payment_method' => $paymentMethod,
            ]);

            // Update invoice total paid
            $invoice->paid_amount_centimes += $amountCentimes;
            
            // Set invoice status
            if ($invoice->paid_amount_centimes >= $invoice->total_amount_centimes) {
                $invoice->status = 'paid';
            } else {
                $invoice->status = 'partial';
            }
            $invoice->save();

            // Proportional allocation to invoice items (Penny-rounding problem)
            $items = $invoice->items()->whereColumn('paid_amount_centimes', '<', 'amount_centimes')->get();
            $totalUnpaidAmount = $items->sum(function($item) {
                return $item->amount_centimes - $item->paid_amount_centimes;
            });

            if ($totalUnpaidAmount > 0) {
                $allocatedTotal = 0;
                $itemCount = $items->count();

                foreach ($items as $index => $item) {
                    $itemRemaining = $item->amount_centimes - $item->paid_amount_centimes;
                    
                    if ($index === $itemCount - 1) {
                        // Last item gets the exact remainder
                        $allocation = $amountCentimes - $allocatedTotal;
                    } else {
                        // Proportional allocation with standard rounding
                        $proportion = $itemRemaining / $totalUnpaidAmount;
                        $allocation = (int) round($amountCentimes * $proportion);
                        $allocatedTotal += $allocation;
                    }

                    $item->paid_amount_centimes += $allocation;
                    $item->save();

                    if ($allocation > 0) {
                        PaymentAllocation::create([
                            'payment_id' => $payment->id,
                            'invoice_item_id' => $item->id,
                            'amount_centimes' => $allocation,
                        ]);
                    }
                }
            }

            return $payment;
        });
    }
}
