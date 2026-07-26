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
            'discount_centimes' => 0,
            'status' => 'unpaid'
        ]);

        $payload = [
            'student_id' => $student->id,
            'payment_method' => 'cash',
            'invoices' => [
                [
                    'invoice_id' => $invoice->id,
                    'amount_centimes' => 60000, // 600 DH > 500 DH
                    'discount_centimes' => 0,
                ]
            ]
        ];

        $response = $this->actingAs($this->user)->postJson("/api/payments", $payload);
        $response->assertStatus(422);
        $this->assertStringContainsString('exceed the balance due', $response->json('message'));
    }

    public function test_payment_with_discount()
    {
        $student = Student::factory()->create();
        $invoice = Invoice::create([
            'student_id' => $student->id,
            'month' => 1,
            'year' => 2026,
            'total_amount_centimes' => 30000, // Total 300 DH
            'paid_amount_centimes' => 0,
            'discount_centimes' => 0,
            'status' => 'unpaid'
        ]);

        // Item 1: 300 DH
        $item1 = $invoice->items()->create([
            'school_class_id' => SchoolClass::factory()->create()->id,
            'amount_centimes' => 30000, 
            'paid_amount_centimes' => 0
        ]);
        
        $payload = [
            'student_id' => $student->id,
            'payment_method' => 'cash',
            'invoices' => [
                [
                    'invoice_id' => $invoice->id,
                    'amount_centimes' => 20000,
                    'discount_centimes' => 5000, // 50 DH discount
                    'discount_reason' => 'Sibling discount'
                ]
            ]
        ];

        $response = $this->actingAs($this->user)->postJson("/api/payments", $payload);
        $response->assertStatus(200);

        $item1->refresh();
        $invoice->refresh();

        $this->assertEquals(20000, $invoice->paid_amount_centimes);
        $this->assertEquals(5000, $invoice->discount_centimes);
        $this->assertEquals('Sibling discount', $invoice->discount_reason);
        $this->assertEquals('partial', $invoice->status);
        $this->assertEquals(5000, $invoice->balance_due_centimes); // 30000 - 5000 - 20000 = 5000
    }

    public function test_can_list_all_payments()
    {
        $student = Student::factory()->create();
        $invoice = Invoice::create([
            'student_id' => $student->id,
            'month' => 1,
            'year' => 2026,
            'total_amount_centimes' => 30000,
            'paid_amount_centimes' => 0,
            'status' => 'unpaid'
        ]);

        \App\Models\Payment::create([
            'invoice_id' => $invoice->id,
            'amount_centimes' => 15000,
            'type' => 'payment',
            'payment_method' => 'cash'
        ]);

        $response = $this->actingAs($this->user)->getJson("/api/payments");
        $response->assertStatus(200);
        $response->assertJsonCount(1, 'data');
        $this->assertEquals(15000, $response->json('data.0.amount_centimes'));
    }
}
