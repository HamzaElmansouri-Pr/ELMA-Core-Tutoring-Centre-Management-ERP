<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Student;
use App\Models\SchoolClass;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\Enrollment;

class AttendanceTest extends TestCase
{
    use RefreshDatabase;

    public function test_bulk_attendance_upsert()
    {
        $teacher = Teacher::factory()->create();
        $subject = Subject::factory()->create();
        $class = SchoolClass::factory()->create([
            'teacher_id' => $teacher->id,
            'subject_id' => $subject->id,
        ]);
        $student = Student::factory()->create();

        $enrollment = Enrollment::create([
            'student_id' => $student->id,
            'school_class_id' => $class->id,
            'status' => 'active',
            'start_date' => now()->startOfMonth()
        ]);

        $sessionDate = '2026-10-12';

        $payload = [
            'class_id' => $class->id,
            'session_date' => $sessionDate,
            'records' => [
                ['enrollment_id' => $enrollment->id, 'status' => 'present']
            ]
        ];

        $user = User::factory()->create();

        // Create
        $this->actingAs($user)->postJson('/api/attendance', $payload)
            ->assertStatus(200);

        $this->assertDatabaseHas('attendance_records', [
            'enrollment_id' => $enrollment->id,
            'status' => 'present'
        ]);

        // Upsert to Late
        $payload['records'][0]['status'] = 'late';
        $this->actingAs($user)->postJson('/api/attendance', $payload)
            ->assertStatus(200);

        $this->assertDatabaseHas('attendance_records', [
            'enrollment_id' => $enrollment->id,
            'status' => 'late'
        ]);
        $this->assertDatabaseCount('attendance_records', 1); // Should overwrite, not duplicate
    }
}
