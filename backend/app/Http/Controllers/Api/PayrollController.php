<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Teacher;
use App\Models\PayrollRecord;
use App\Actions\Finance\CalculateTeacherPayrollAction;

class PayrollController extends Controller
{
    public function index(Request $request)
    {
        $request->validate([
            'month' => 'required|integer|min:1|max:12',
            'year' => 'required|integer|min:2000',
        ]);

        $month = $request->month;
        $year = $request->year;

        $teachers = Teacher::with(['payrollRecords' => function($q) use ($month, $year) {
            $q->where('month', $month)->where('year', $year);
        }])->get();

        $data = $teachers->map(function ($teacher) {
            $record = $teacher->payrollRecords->first();
            return [
                'teacher_id' => $teacher->id,
                'teacher_name' => $teacher->name,
                'commission_percentage' => $record ? $record->commission_percentage : $teacher->commission_percentage,
                'gross_collected_centimes' => $record ? $record->gross_collected_centimes : 0,
                'payout_amount_centimes' => $record ? $record->payout_amount_centimes : 0,
                'status' => $record ? $record->status : 'not_calculated',
                'record' => $record,
            ];
        });

        return response()->json(['data' => $data]);
    }

    public function calculate(Request $request, CalculateTeacherPayrollAction $action)
    {
        $data = $request->validate([
            'teacher_id' => 'required|exists:teachers,id',
            'month' => 'required|integer|min:1|max:12',
            'year' => 'required|integer|min:2000',
        ]);

        try {
            $record = $action->execute($data['teacher_id'], $data['month'], $data['year']);
            return response()->json(['data' => $record], 200);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function markPaid(PayrollRecord $record)
    {
        if ($record->status === 'paid') {
            return response()->json(['message' => 'Record is already marked as paid.'], 422);
        }

        $record->update(['status' => 'paid']);

        return response()->json(['data' => $record], 200);
    }
}
