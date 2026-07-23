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

class PaymentTest extends TestCase
{
    use RefreshDatabase;

    protected $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    public function test_payment_rejects_overpayment()
    {
        $student = Student::factory()->create();
        $invoice = Invoice::create([
            'student_id' => $student->id,
            'month' => 1,
            'year' => 2026,
            'total_amount_centimes' => 50000,
            'paid_amount_centimes' => 0,
            'status' => 'unpaid'
        ]);

        $payload = [
            'amount_centimes' => 60000, // 600 DH > 500 DH
            'type' => 'payment',
        ];

        $response = $this->actingAs($this->user)->postJson("/api/invoices/{$invoice->id}/payments", $payload);
        $response->assertStatus(422);
        $this->assertStringContainsString('exceed the balance due', $response->json('message'));
    }

    public function test_proportional_allocation_and_penny_rounding()
    {
        $student = Student::factory()->create();
        $invoice = Invoice::create([
            'student_id' => $student->id,
            'month' => 1,
            'year' => 2026,
            'total_amount_centimes' => 30000, // Total 300 DH
            'paid_amount_centimes' => 0,
            'status' => 'unpaid'
        ]);

        // Item 1: 100 DH
        $item1 = $invoice->items()->create([
            'school_class_id' => SchoolClass::factory()->create()->id,
            'amount_centimes' => 10000, 
            'paid_amount_centimes' => 0
        ]);

        // Item 2: 200 DH
        $item2 = $invoice->items()->create([
            'school_class_id' => SchoolClass::factory()->create()->id,
            'amount_centimes' => 20000,
            'paid_amount_centimes' => 0
        ]);

        // Pay 100 DH. Should allocate 33.33 DH to Item 1, and 66.67 DH to Item 2.
        // Wait, standard rounding:
        // Item 1: 100 / 300 * 10000 = 3333.33 -> 3333
        // Item 2 gets the remainder: 10000 - 3333 = 6667.
        
        $payload = [
            'amount_centimes' => 10000,
            'type' => 'payment',
        ];

        $response = $this->actingAs($this->user)->postJson("/api/invoices/{$invoice->id}/payments", $payload);
        $response->assertStatus(201);

        $item1->refresh();
        $item2->refresh();
        $invoice->refresh();

        $this->assertEquals(10000, $invoice->paid_amount_centimes);
        $this->assertEquals('partial', $invoice->status);
        $this->assertEquals(3333, $item1->paid_amount_centimes);
        $this->assertEquals(6667, $item2->paid_amount_centimes);
    }
}
