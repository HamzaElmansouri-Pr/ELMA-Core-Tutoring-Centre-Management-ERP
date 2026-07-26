<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\SchoolClass;
use Laravel\Sanctum\Sanctum;

class SchoolClassTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Sanctum::actingAs(User::factory()->create());
    }

    public function test_can_create_school_class()
    {
        $subject = Subject::factory()->create();
        $teacher = Teacher::factory()->create();

        $response = $this->postJson('/api/school-classes', [
            'name' => 'Math 101',
            'subject_id' => $subject->id,
            'teacher_id' => $teacher->id,
            'price_centimes' => 30000,
        ]);

        $response->assertStatus(201)->assertJsonPath('data.name', 'Math 101');
        $this->assertDatabaseHas('school_classes', ['name' => 'Math 101', 'subject_id' => $subject->id, 'price_centimes' => 30000]);
    }

    public function test_validation_fails_for_soft_deleted_teacher()
    {
        $subject = Subject::factory()->create();
        $teacher = Teacher::factory()->create();
        $teacher->delete(); // soft delete

        $response = $this->postJson('/api/school-classes', [
            'name' => 'Math 101',
            'subject_id' => $subject->id,
            'teacher_id' => $teacher->id,
            'price_centimes' => 30000,
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors(['teacher_id']);
    }
}
