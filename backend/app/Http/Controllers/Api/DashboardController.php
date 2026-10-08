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

        $activeTeachersCount = \App\Models\Teacher::count();

        $activeClassesCount = \App\Models\SchoolClass::where('is_active', true)->count();

        return response()->json([
            'data' => [
                'revenue_this_month_centimes' => $netRevenueCentimes,
                'active_students' => $activeStudentsCount,
                'total_teachers' => $activeTeachersCount,
                'total_classes' => $activeClassesCount,
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

    public function statsBreakdown()
    {
        $subjects = \App\Models\Subject::all();

        $data = $subjects->map(function ($subject) {
            $enrollmentCount = \App\Models\Enrollment::where('status', 'active')
                ->whereHas('schoolClass', function ($q) use ($subject) {
                    $q->where('subject_id', $subject->id);
                })->count();

            $classCount = $subject->schoolClasses()->count();

            return [
                'name' => $subject->name,
                'Students' => $enrollmentCount,
                'Classes' => $classCount,
            ];
        });

        return response()->json(['data' => $data]);
    }
}
