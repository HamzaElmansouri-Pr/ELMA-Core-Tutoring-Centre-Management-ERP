<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Student;
use App\Models\SchoolClass;
use App\Models\Subject;
use App\Models\Enrollment;
use App\Models\Invoice;

class InvoiceTest extends TestCase
{
    use RefreshDatabase;

    protected $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    public function test_invoice_generation_is_idempotent()
    {
        $student = Student::factory()->create();
        $subject = Subject::factory()->create(['default_price_centimes' => 50000]); // 500 DH
        $schoolClass = SchoolClass::factory()->create(['subject_id' => $subject->id]);

        Enrollment::create([
            'student_id' => $student->id,
            'school_class_id' => $schoolClass->id,
            'status' => 'active',
            'start_date' => now()->startOfMonth(),
        ]);

        $payload = [
            'month' => now()->month,
            'year' => now()->year,
        ];

        // First generation
        $response = $this->actingAs($this->user)->postJson('/api/invoices/generate', $payload);
        $response->assertStatus(201);
        $this->assertEquals(1, $response->json('generated'));
        $this->assertDatabaseCount('invoices', 1);

        // Second generation (idempotence)
        $response2 = $this->actingAs($this->user)->postJson('/api/invoices/generate', $payload);
        $response2->assertStatus(201);
        $this->assertEquals(0, $response2->json('generated'));
        $this->assertDatabaseCount('invoices', 1); // Should still be 1
    }

    public function test_cannot_generate_invoices_for_far_future()
    {
        $payload = [
            'month' => now()->addMonths(2)->month,
            'year' => now()->addMonths(2)->year,
        ];

        $response = $this->actingAs($this->user)->postJson('/api/invoices/generate', $payload);
        $response->assertStatus(422);
    }
}
