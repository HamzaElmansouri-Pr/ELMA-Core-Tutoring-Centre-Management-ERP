<?php

namespace App\Actions\Finance;

use App\Models\Student;
use App\Models\Invoice;
use App\Models\Enrollment;
use Illuminate\Support\Facades\DB;
use Exception;
use Carbon\Carbon;

class GenerateMonthlyInvoicesAction
{
    public function execute(int $month, int $year): array
    {
        $targetDate = Carbon::create($year, $month, 1)->startOfMonth();
        $nextMonth = now()->addMonth()->startOfMonth();

        if ($targetDate->greaterThan($nextMonth)) {
            throw new Exception("Cannot generate invoices for future months beyond next month.");
        }

        $generatedCount = 0;

        // Find all students with enrollments that were active during this month
        $students = Student::with(['enrollments' => function ($query) use ($targetDate) {
            $endOfMonth = $targetDate->copy()->endOfMonth();
            $query->where(function ($q) use ($targetDate, $endOfMonth) {
                // Active enrollments that started before the end of the target month
                $q->where('status', 'active')
                  ->where('start_date', '<=', $endOfMonth);
            })->orWhere(function ($q) use ($targetDate, $endOfMonth) {
                // Ended enrollments that overlapped with the target month
                $q->where('status', 'ended')
                  ->where('start_date', '<=', $endOfMonth)
                  ->where('end_date', '>=', $targetDate);
            });
        }, 'enrollments.schoolClass.subject'])->get();

        foreach ($students as $student) {
            if ($student->enrollments->isEmpty()) {
                continue;
            }

            // Check for idempotence: invoice already exists for this month/year?
            $exists = Invoice::where('student_id', $student->id)
                ->where('month', $month)
                ->where('year', $year)
                ->exists();

            if ($exists) {
                continue;
            }

            DB::transaction(function () use ($student, $month, $year, &$generatedCount) {
                $totalCentimes = 0;
                $items = [];

                foreach ($student->enrollments as $enrollment) {
                    $price = $enrollment->schoolClass->subject->default_price_centimes;
                    $totalCentimes += $price;
                    $items[] = [
                        'school_class_id' => $enrollment->school_class_id,
                        'amount_centimes' => $price,
                        'paid_amount_centimes' => 0,
                    ];
                }

                $invoice = Invoice::create([
                    'student_id' => $student->id,
                    'month' => $month,
                    'year' => $year,
                    'total_amount_centimes' => $totalCentimes,
                    'paid_amount_centimes' => 0,
                    'status' => 'unpaid',
                ]);

                $invoice->items()->createMany($items);
                $generatedCount++;
            });
        }

        return [
            'generated' => $generatedCount,
        ];
    }
}
