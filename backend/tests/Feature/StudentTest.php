<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Student;

class StudentTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create();
    }

    public function test_can_list_students()
    {
        Student::factory()->count(3)->create();

        $response = $this->actingAs($this->admin)
            ->getJson('/api/students');

        $response->assertStatus(200)
            ->assertJsonCount(3, 'data');
    }

    public function test_can_create_student()
    {
        $payload = [
            'name' => 'Alice Student',
            'parent_phone' => '1234567890',
        ];

        $response = $this->actingAs($this->admin)
            ->postJson('/api/students', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('data.name', 'Alice Student');

        $this->assertDatabaseHas('students', ['name' => 'Alice Student']);
    }

    public function test_can_update_student()
    {
        $student = Student::factory()->create([
            'name' => 'Bob Student',
            'parent_phone' => '0987654321'
        ]);

        $response = $this->actingAs($this->admin)
            ->putJson("/api/students/{$student->id}", [
                'name' => 'Bob Smith',
                'parent_phone' => '1112223333'
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.name', 'Bob Smith');

        $this->assertDatabaseHas('students', ['name' => 'Bob Smith', 'parent_phone' => '1112223333']);
    }

    public function test_can_soft_delete_student()
    {
        $student = Student::factory()->create();

        $response = $this->actingAs($this->admin)
            ->deleteJson("/api/students/{$student->id}");

        $response->assertStatus(204);

        $this->assertSoftDeleted('students', ['id' => $student->id]);
    }
}
