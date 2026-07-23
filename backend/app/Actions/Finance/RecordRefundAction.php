<?php

namespace App\Actions\Finance;

use App\Models\Invoice;
use App\Models\Payment;
use App\Models\PaymentAllocation;
use Illuminate\Support\Facades\DB;
use Exception;

class RecordRefundAction
{
    public function execute(Invoice $invoice, int $amountCentimes, string $reason): Payment
    {
        if (empty(trim($reason))) {
            throw new Exception("A reason is required for refunds/withdrawals.");
        }

        if ($amountCentimes <= 0) {
            throw new Exception("Refund amount must be greater than zero.");
        }

        if ($amountCentimes > $invoice->paid_amount_centimes) {
            throw new Exception("Refund amount cannot exceed the total amount already paid.");
        }

        return DB::transaction(function () use ($invoice, $amountCentimes, $reason) {
            $refund = Payment::create([
                'invoice_id' => $invoice->id,
                'amount_centimes' => $amountCentimes, // Keeping it positive in DB, but type is refund
                'type' => 'refund',
                'reason' => $reason,
            ]);

            $invoice->paid_amount_centimes -= $amountCentimes;

            if ($invoice->paid_amount_centimes === 0) {
                $invoice->status = 'unpaid';
            } else {
                $invoice->status = 'partial';
            }
            $invoice->save();

            // Reverse allocation proportionally across items that have been paid
            $items = $invoice->items()->where('paid_amount_centimes', '>', 0)->get();
            $totalPaidAmount = $items->sum('paid_amount_centimes');

            if ($totalPaidAmount > 0) {
                $deallocatedTotal = 0;
                $itemCount = $items->count();

                foreach ($items as $index => $item) {
                    if ($index === $itemCount - 1) {
                        $deallocation = $amountCentimes - $deallocatedTotal;
                    } else {
                        $proportion = $item->paid_amount_centimes / $totalPaidAmount;
                        $deallocation = (int) round($amountCentimes * $proportion);
                        $deallocatedTotal += $deallocation;
                    }

                    $item->paid_amount_centimes -= $deallocation;
                    // Failsafe bounds check
                    if ($item->paid_amount_centimes < 0) {
                        $deallocation += $item->paid_amount_centimes;
                        $item->paid_amount_centimes = 0;
                    }
                    $item->save();

                    if ($deallocation > 0) {
                        PaymentAllocation::create([
                            'payment_id' => $refund->id,
                            'invoice_item_id' => $item->id,
                            'amount_centimes' => -$deallocation,
                        ]);
                    }
                }
            }

            return $refund;
        });
    }
}
