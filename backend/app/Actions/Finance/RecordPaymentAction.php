<?php

namespace App\Actions\Finance;

use App\Models\Invoice;
use App\Models\Payment;
use App\Models\PaymentAllocation;
use Illuminate\Support\Facades\DB;

class RecordPaymentAction
{
    public function execute(Invoice $invoice, int $amountCentimes, string $paymentMethod = 'cash', ?int $discountCentimes = null, ?string $discountReason = null): Payment
    {
        if ($amountCentimes <= 0) {
            throw new \InvalidArgumentException("Payment amount must be greater than zero.");
        }

        return DB::transaction(function () use ($invoice, $amountCentimes, $paymentMethod, $discountCentimes, $discountReason) {
            $invoice = Invoice::query()->lockForUpdate()->findOrFail($invoice->id);

            if ($discountCentimes !== null) {
                $maximumDiscount = $invoice->total_amount_centimes - $invoice->paid_amount_centimes;

                if ($discountCentimes > $maximumDiscount) {
                    throw new \InvalidArgumentException('Discount cannot exceed the unpaid invoice amount.');
                }

                $invoice->discount_centimes = $discountCentimes;
                $invoice->discount_reason = $discountReason;
            }

            $balanceDue = $invoice->balance_due_centimes;

            if ($amountCentimes > $balanceDue) {
                throw new \InvalidArgumentException('Payment amount cannot exceed the balance due.');
            }

            $payment = Payment::create([
                'invoice_id' => $invoice->id,
                'amount_centimes' => $amountCentimes,
                'type' => 'payment',
                'payment_method' => $paymentMethod,
            ]);

            $invoice->paid_amount_centimes += $amountCentimes;
            $newBalanceDue = $invoice->balance_due_centimes;
            if ($newBalanceDue <= 0) {
                $invoice->status = 'paid';
            } else {
                $invoice->status = 'partial';
            }
            $invoice->save();

            $items = $invoice->items()->whereColumn('paid_amount_centimes', '<', 'amount_centimes')->get();
            $totalUnpaidAmount = $items->sum(function ($item) {
                return $item->amount_centimes - $item->paid_amount_centimes;
            });

            if ($totalUnpaidAmount > 0) {
                $allocatedTotal = 0;
                $itemCount = $items->count();

                foreach ($items as $index => $item) {
                    $itemRemaining = $item->amount_centimes - $item->paid_amount_centimes;
                    
                    if ($index === $itemCount - 1) {
                        $allocation = $amountCentimes - $allocatedTotal;
                    } else {
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
