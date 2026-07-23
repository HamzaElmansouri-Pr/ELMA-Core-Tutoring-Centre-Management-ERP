<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Models\AttendanceRecord;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AttendanceController extends Controller
{
    public function show($class_id, $session_date)
    {
        // Find all enrollments for this class
        $enrollments = Enrollment::with('student')
            ->where('school_class_id', $class_id)
            ->get();

        // Get existing attendance records for this date
        $records = AttendanceRecord::whereIn('enrollment_id', $enrollments->pluck('id'))
            ->where('session_date', $session_date)
            ->get()
            ->keyBy('enrollment_id');

        $data = $enrollments->map(function ($enrollment) use ($records) {
            $record = $records->get($enrollment->id);
            return [
                'enrollment_id' => $enrollment->id,
                'student_name' => $enrollment->student->name,
                'status' => $record ? $record->status : null,
            ];
        });

        return response()->json(['data' => $data]);
    }

    public function upsert(Request $request)
    {
        $data = $request->validate([
            'class_id' => 'required|exists:school_classes,id',
            'session_date' => 'required|date',
            'records' => 'required|array',
            'records.*.enrollment_id' => 'required|exists:enrollments,id',
            'records.*.status' => 'required|in:present,absent,late',
        ]);

        $session_date = $data['session_date'];

        DB::transaction(function() use ($data, $session_date) {
            foreach ($data['records'] as $record) {
                AttendanceRecord::updateOrCreate(
                    [
                        'enrollment_id' => $record['enrollment_id'],
                        'session_date' => $session_date,
                    ],
                    [
                        'status' => $record['status']
                    ]
                );
            }
        });

        return response()->json(['message' => 'Attendance saved successfully.'], 200);
    }
}
