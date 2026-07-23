<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Student;
use App\Models\SchoolClass;
use App\Models\Invoice;
use App\Models\PaymentAllocation;
use Illuminate\Http\Request;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function kpis()
    {
        $startOfMonth = now()->startOfMonth();
        $endOfMonth = now()->endOfMonth();

        $revenueCentimes = Payment::where('type', 'payment')
            ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
            ->sum('amount_centimes');

        $refundsCentimes = Payment::where('type', 'refund')
            ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
            ->sum('amount_centimes');

        $netRevenueCentimes = $revenueCentimes - $refundsCentimes;

        $activeStudentsCount = Student::whereHas('enrollments', function ($q) {
            $q->where('status', 'active');
        })->count();

        $todayStr = strtolower(now()->englishDayOfWeek);
        
        $activeClasses = SchoolClass::where('is_active', true)->get();
        $sessionsToday = 0;
        foreach ($activeClasses as $class) {
            if ($class->schedule_info && is_array($class->schedule_info)) {
                foreach ($class->schedule_info as $slot) {
                    if (strtolower($slot['day']) === $todayStr) {
                        $sessionsToday++;
                    }
                }
            }
        }

        return response()->json([
            'data' => [
                'revenue_this_month_centimes' => $netRevenueCentimes,
                'active_students' => $activeStudentsCount,
                'sessions_today' => $sessionsToday,
            ]
        ]);
    }

    public function unpaidAlerts()
    {
        $invoices = Invoice::with('student')
            ->whereIn('status', ['unpaid', 'partial'])
            ->orderBy('created_at', 'asc')
            ->take(10)
            ->get();

        $alerts = $invoices->map(function ($inv) {
            return [
                'invoice_id' => $inv->id,
                'student_name' => $inv->student->name,
                'parent_phone' => $inv->student->parent_phone,
                'amount_due_centimes' => $inv->balance_due_centimes,
                'month' => $inv->month,
                'year' => $inv->year,
            ];
        });

        return response()->json(['data' => $alerts]);
    }

    public function profitBreakdown()
    {
        $start = now()->subMonths(5)->startOfMonth();
        $end = now()->endOfMonth();

        $allocations = PaymentAllocation::with(['invoiceItem.schoolClass.subject', 'payment'])
            ->whereHas('payment', function($q) use ($start, $end) {
                $q->whereBetween('created_at', [$start, $end]);
            })
            ->get();

        $months = [];
        for ($i = 5; $i >= 0; $i--) {
            $d = now()->subMonths($i);
            $key = $d->format('M Y');
            $months[$key] = ['name' => $key];
        }

        foreach ($allocations as $alloc) {
            if (!$alloc->payment) continue;

            $monthKey = $alloc->payment->created_at->format('M Y');
            $subjectName = $alloc->invoiceItem->schoolClass->subject->name ?? 'Unknown';
            
            if (!isset($months[$monthKey][$subjectName])) {
                $months[$monthKey][$subjectName] = 0;
            }
            
            $months[$monthKey][$subjectName] += $alloc->amount_centimes;
        }

        return response()->json(['data' => array_values($months)]);
    }
}
