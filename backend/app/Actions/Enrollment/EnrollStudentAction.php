<?php

namespace App\Actions\Enrollment;

use App\Models\Enrollment;
use Illuminate\Support\Facades\DB;
use Exception;

class EnrollStudentAction
{
    public function execute(array $data): Enrollment
    {
        return DB::transaction(function () use ($data) {
            // Check if already enrolled and active
            $existing = Enrollment::where('student_id', $data['student_id'])
                ->where('school_class_id', $data['school_class_id'])
                ->where('status', 'active')
                ->first();

            if ($existing) {
                throw new Exception('Student is already active in this class.');
            }

            return Enrollment::create([
                'student_id' => $data['student_id'],
                'school_class_id' => $data['school_class_id'],
                'status' => 'active',
                'start_date' => $data['start_date'] ?? now()->toDateString(),
            ]);
        });
    }
}
