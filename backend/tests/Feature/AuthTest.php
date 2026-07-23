<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_login_with_correct_credentials()
    {
        $user = User::factory()->create([
            'password' => bcrypt('password123'),
        ]);

        $response = $this->withHeaders(['Referer' => 'http://localhost:5173'])->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'password123',
        ]);

        $response->assertStatus(200);
        $this->assertAuthenticatedAs($user);
    }

    public function test_login_fails_with_incorrect_credentials()
    {
        $user = User::factory()->create([
            'password' => bcrypt('password123'),
        ]);

        $response = $this->withHeaders(['Referer' => 'http://localhost:5173'])->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(401);
        $this->assertGuest();
    }

    public function test_user_can_logout()
    {
        $user = User::factory()->create([
            'password' => bcrypt('password123'),
        ]);
        
        $this->withHeaders(['Referer' => 'http://localhost:5173'])->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'password123',
        ]);
        
        $response = $this->withHeaders(['Referer' => 'http://localhost:5173'])->postJson('/api/logout');

        $response->assertStatus(200);
        $this->assertGuest();
    }

    public function test_authenticated_user_can_fetch_their_profile()
    {
        $user = User::factory()->create([
            'preferred_locale' => 'ar'
        ]);

        $response = $this->actingAs($user)->withHeaders(['Referer' => 'http://localhost:5173'])->getJson('/api/me');

        $response->assertStatus(200)
                 ->assertJsonPath('email', $user->email)
                 ->assertJsonPath('preferred_locale', 'ar');
    }

    public function test_unauthenticated_user_cannot_access_me()
    {
        $response = $this->withHeaders(['Referer' => 'http://localhost:5173'])->getJson('/api/me');
        $response->assertStatus(401);
    }
}
