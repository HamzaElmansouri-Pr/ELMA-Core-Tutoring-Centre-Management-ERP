<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Teacher;
use App\Models\SchoolClass;
use App\Models\Subject;

class TimetableTest extends TestCase
{
    use RefreshDatabase;

    public function test_timetable_returns_flattened_schedule()
    {
        $teacher = Teacher::factory()->create();
        $subject = Subject::factory()->create();
        $class = SchoolClass::factory()->create([
            'teacher_id' => $teacher->id,
            'subject_id' => $subject->id,
        ]);
        $classroom = \App\Models\Classroom::create([
            'name' => 'Room 101',
            'capacity' => 30
        ]);

        \App\Models\ClassSession::create([
            'school_class_id' => $class->id,
            'classroom_id' => $classroom->id,
            'day_of_week' => 'monday',
            'start_time' => '14:00:00',
            'end_time' => '16:00:00',
        ]);
        \App\Models\ClassSession::create([
            'school_class_id' => $class->id,
            'classroom_id' => $classroom->id,
            'day_of_week' => 'thursday',
            'start_time' => '10:00:00',
            'end_time' => '12:00:00',
        ]);

        $response = $this->actingAs(User::factory()->create())->getJson('/api/timetable');

        $response->assertStatus(200);
        $this->assertCount(2, $response->json('data'));
        $this->assertEquals('monday', $response->json('data.0.day'));
        $this->assertEquals('14:00', $response->json('data.0.start'));
        $this->assertEquals($class->name, $response->json('data.0.class_name'));
        $this->assertEquals($teacher->name, $response->json('data.0.teacher_name'));
    }
}
