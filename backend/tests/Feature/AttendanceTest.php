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

    public function test_attendance_cannot_be_recorded_for_an_enrollment_in_another_class(): void
    {
        $teacher = Teacher::factory()->create();
        $subject = Subject::factory()->create();
        $targetClass = SchoolClass::factory()->create([
            'teacher_id' => $teacher->id,
            'subject_id' => $subject->id,
        ]);
        $otherClass = SchoolClass::factory()->create([
            'teacher_id' => $teacher->id,
            'subject_id' => $subject->id,
        ]);
        $enrollment = Enrollment::create([
            'student_id' => Student::factory()->create()->id,
            'school_class_id' => $otherClass->id,
            'status' => 'active',
            'start_date' => now()->subDay(),
        ]);

        $this->actingAs(User::factory()->create())
            ->postJson('/api/attendance', [
                'class_id' => $targetClass->id,
                'session_date' => now()->toDateString(),
                'records' => [
                    ['enrollment_id' => $enrollment->id, 'status' => 'present'],
                ],
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('records');

        $this->assertDatabaseCount('attendance_records', 0);
    }
}
