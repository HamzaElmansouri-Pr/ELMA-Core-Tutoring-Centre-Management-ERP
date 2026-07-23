<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Teacher;

class TeacherTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create();
    }

    public function test_can_list_teachers()
    {
        Teacher::factory()->count(3)->create();

        $response = $this->actingAs($this->admin)
            ->getJson('/api/teachers');

        $response->assertStatus(200)
            ->assertJsonCount(3, 'data');
    }

    public function test_can_create_teacher()
    {
        $payload = [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'commission_percentage' => 50,
            'is_active' => true,
        ];

        $response = $this->actingAs($this->admin)
            ->postJson('/api/teachers', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('data.name', 'John Doe');

        $this->assertDatabaseHas('teachers', ['email' => 'john@example.com']);
    }

    public function test_can_update_teacher()
    {
        $teacher = Teacher::factory()->create([
            'name' => 'Jane Doe',
            'commission_percentage' => 40
        ]);

        $response = $this->actingAs($this->admin)
            ->putJson("/api/teachers/{$teacher->id}", [
                'name' => 'Jane Smith',
                'commission_percentage' => 45
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.name', 'Jane Smith');

        $this->assertDatabaseHas('teachers', ['name' => 'Jane Smith', 'commission_percentage' => 45]);
    }

    public function test_can_soft_delete_teacher()
    {
        $teacher = Teacher::factory()->create();

        $response = $this->actingAs($this->admin)
            ->deleteJson("/api/teachers/{$teacher->id}");

        $response->assertStatus(204);

        $this->assertSoftDeleted('teachers', ['id' => $teacher->id]);
    }
}
