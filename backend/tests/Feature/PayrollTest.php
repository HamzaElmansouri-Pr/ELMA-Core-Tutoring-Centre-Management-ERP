<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Teacher;
use App\Models\Student;
use App\Models\SchoolClass;
use App\Models\Subject;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\PayrollRecord;

class PayrollTest extends TestCase
{
    use RefreshDatabase;

    protected $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    public function test_cash_basis_payroll_calculation()
    {
        $teacher = Teacher::factory()->create(['commission_percentage' => 50.00]); // 50%
        $subject = Subject::factory()->create();
        $schoolClass = SchoolClass::factory()->create(['teacher_id' => $teacher->id, 'subject_id' => $subject->id]);

        $student = Student::factory()->create();
        $invoice = Invoice::create([
            'student_id' => $student->id,
            'month' => 1,
            'year' => 2026,
            'total_amount_centimes' => 40000,
            'paid_amount_centimes' => 0,
            'status' => 'unpaid'
        ]);

        $item = $invoice->items()->create([
            'school_class_id' => $schoolClass->id,
            'amount_centimes' => 40000,
            'paid_amount_centimes' => 0
        ]);

        // Pay 10000 centimes
        $this->actingAs($this->user)->postJson("/api/payments", [
            'student_id' => $student->id,
            'payment_method' => 'cash',
            'invoices' => [
                [
                    'invoice_id' => $invoice->id,
                    'amount_centimes' => 10000,
                ]
            ]
        ])->assertStatus(200);

        // Calculate payroll for the current month/year
        $month = now()->month;
        $year = now()->year;

        $response = $this->actingAs($this->user)->postJson("/api/payroll/calculate", [
            'teacher_id' => $teacher->id,
            'month' => $month,
            'year' => $year,
        ]);
        
        $response->assertStatus(200);
    }

    public function test_locked_payroll_cannot_be_recalculated()
    {
        $teacher = Teacher::factory()->create();
        
        $record = PayrollRecord::create([
            'teacher_id' => $teacher->id,
            'month' => now()->month,
            'year' => now()->year,
            'gross_collected_centimes' => 50000,
            'commission_percentage' => 50.00,
            'payout_amount_centimes' => 25000,
            'status' => 'paid',
        ]);

        $response = $this->actingAs($this->user)->postJson("/api/payroll/calculate", [
            'teacher_id' => $teacher->id,
            'month' => now()->month,
            'year' => now()->year,
        ]);
        
        $response->assertStatus(422);
        $this->assertStringContainsString('cannot be recalculated', $response->json('message'));
    }
}
