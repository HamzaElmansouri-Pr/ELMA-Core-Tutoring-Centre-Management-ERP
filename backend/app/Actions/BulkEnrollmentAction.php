<?php

namespace App\Actions;

use App\Models\Student;
use App\Models\Enrollment;
use Illuminate\Support\Facades\DB;

class BulkEnrollmentAction
{
    /**
     * Enroll a student into multiple classes simultaneously.
     * 
     * @param Student $student
     * @param array $classIds Array of SchoolClass IDs
     * @param string|null $startDate Optional start date
     * @return array
     */
    public function execute(Student $student, array $classIds, ?string $startDate = null)
    {
        $enrolledIds = [];
        $skippedIds = [];

        DB::transaction(function () use ($student, $classIds, $startDate, &$enrolledIds, &$skippedIds) {
            // Get currently active class IDs for this student
            $activeClassIds = $student->activeEnrollments()->pluck('school_class_id')->toArray();

            foreach ($classIds as $classId) {
                // If they are already actively enrolled, skip to prevent duplicate enrollments
                if (in_array($classId, $activeClassIds)) {
                    $skippedIds[] = $classId;
                    continue;
                }

                // Create the new enrollment
                $enrollment = Enrollment::create([
                    'student_id' => $student->id,
                    'school_class_id' => $classId,
                    'status' => 'active',
                    'start_date' => $startDate ?? now()->toDateString(),
                ]);

                $enrolledIds[] = $enrollment->id;
            }
        });

        return [
            'enrolled_count' => count($enrolledIds),
            'skipped_count' => count($skippedIds),
            'enrolled_ids' => $enrolledIds,
        ];
    }
}
