<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Subject;
use Laravel\Sanctum\Sanctum;

class SubjectTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Sanctum::actingAs(User::factory()->create());
    }

    public function test_can_list_subjects()
    {
        Subject::factory()->count(3)->create();
        $response = $this->getJson('/api/subjects');
        $response->assertStatus(200)->assertJsonCount(3, 'data');
    }

    public function test_can_create_subject()
    {
        $response = $this->postJson('/api/subjects', [
            'name' => 'Math',
            'description' => 'Math classes',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.name', 'Math');

        $this->assertDatabaseHas('subjects', ['name' => 'Math']);
    }

    public function test_can_update_subject()
    {
        $subject = Subject::factory()->create(['name' => 'Old']);
        $response = $this->putJson("/api/subjects/{$subject->id}", ['name' => 'New']);
        
        $response->assertStatus(200)->assertJsonPath('data.name', 'New');
        $this->assertDatabaseHas('subjects', ['name' => 'New']);
    }

    public function test_can_soft_delete_subject()
    {
        $subject = Subject::factory()->create();
        $response = $this->deleteJson("/api/subjects/{$subject->id}");
        
        $response->assertStatus(204);
        $this->assertSoftDeleted($subject);
    }
}
