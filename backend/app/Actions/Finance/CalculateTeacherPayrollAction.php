<?php

namespace App\Actions\Finance;

use App\Models\PayrollRecord;
use App\Models\Teacher;
use App\Models\PaymentAllocation;
use Carbon\Carbon;
use Exception;

class CalculateTeacherPayrollAction
{
    public function execute(int $teacherId, int $month, int $year): PayrollRecord
    {
        $record = PayrollRecord::where('teacher_id', $teacherId)
            ->where('month', $month)
            ->where('year', $year)
            ->first();

        if ($record && $record->status === 'paid') {
            throw new Exception("Payroll record is already marked as paid and cannot be recalculated.");
        }

        $teacher = Teacher::findOrFail($teacherId);

        $targetDate = Carbon::create($year, $month, 1)->startOfMonth();
        $endDate = $targetDate->copy()->endOfMonth();

        $allocations = PaymentAllocation::with([
                'payment', 
                'invoiceItem.invoice.student', 
                'invoiceItem.schoolClass.subject'
            ])
            ->whereHas('payment', function($q) use ($targetDate, $endDate) {
                $q->whereBetween('created_at', [$targetDate, $endDate]);
            })
            ->whereHas('invoiceItem.schoolClass', function($q) use ($teacherId) {
                $q->where('teacher_id', $teacherId);
            })
            ->get();

        $grossCollected = $allocations->sum('amount_centimes');
        $commissionPercentage = $teacher->commission_percentage;
        $payoutAmount = (int) round($grossCollected * ($commissionPercentage / 100));

        $breakdown = $allocations->map(function ($alloc) {
            return [
                'allocation_id' => $alloc->id,
                'date' => $alloc->payment->created_at->toIso8601String(),
                'type' => $alloc->amount_centimes >= 0 ? 'payment' : 'refund',
                'student_name' => $alloc->invoiceItem->invoice->student->name,
                'class_name' => $alloc->invoiceItem->schoolClass->name,
                'subject_name' => $alloc->invoiceItem->schoolClass->subject->name,
                'amount_centimes' => $alloc->amount_centimes,
            ];
        })->toArray();

        if ($record) {
            $record->update([
                'gross_collected_centimes' => $grossCollected,
                'commission_percentage' => $commissionPercentage,
                'payout_amount_centimes' => $payoutAmount,
                'breakdown' => $breakdown,
                'status' => 'calculated',
            ]);
            return $record;
        }

        return PayrollRecord::create([
            'teacher_id' => $teacher->id,
            'month' => $month,
            'year' => $year,
            'gross_collected_centimes' => $grossCollected,
            'commission_percentage' => $commissionPercentage,
            'payout_amount_centimes' => $payoutAmount,
            'breakdown' => $breakdown,
            'status' => 'calculated',
        ]);
    }
}
