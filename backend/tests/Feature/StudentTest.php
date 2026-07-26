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
            ->assertJsonPath('data.first_name', 'Alice')
            ->assertJsonPath('data.last_name', 'Student');

        $this->assertDatabaseHas('students', ['first_name' => 'Alice', 'last_name' => 'Student']);
    }

    public function test_can_update_student()
    {
        $student = Student::factory()->create([
            'first_name' => 'Bob',
            'last_name' => 'Student',
            'parent_phone' => '0987654321'
        ]);

        $response = $this->actingAs($this->admin)
            ->putJson("/api/students/{$student->id}", [
                'name' => 'Bob Smith',
                'parent_phone' => '1112223333'
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.first_name', 'Bob')
            ->assertJsonPath('data.last_name', 'Smith');

        $this->assertDatabaseHas('students', ['first_name' => 'Bob', 'last_name' => 'Smith', 'parent_phone' => '1112223333']);
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
