<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;
use App\Models\Teacher;
use App\Models\Student;
use App\Models\Subject;
use App\Models\SchoolClass;
use App\Models\Enrollment;
use App\Models\Invoice;
use App\Actions\Finance\GenerateMonthlyInvoicesAction;
use Carbon\Carbon;

class EdgeCaseTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create();
    }

    /**
     * 6.1.1 - Invoice generation ignores students with zero active enrollments.
     */
    public function test_invoice_generation_ignores_students_with_no_enrollments(): void
    {
        // Create a student with no enrollments at all
        Student::factory()->create(['name' => 'Loner Student']);

        $action = new GenerateMonthlyInvoicesAction();
        $result = $action->execute(now()->month, now()->year);

        $this->assertEquals(0, $result['generated']);
        $this->assertDatabaseCount('invoices', 0);
    }

    /**
     * 6.1.2 - Ending an enrollment mid-month does NOT alter/delete an already-generated invoice.
     */
    public function test_ending_enrollment_does_not_alter_existing_invoice(): void
    {
        $subject = Subject::factory()->create(['default_price_centimes' => 30000]);
        $teacher = Teacher::factory()->create();
        $class = SchoolClass::factory()->create([
            'subject_id' => $subject->id,
            'teacher_id' => $teacher->id,
            'is_active' => true,
        ]);
        $student = Student::factory()->create();
        $enrollment = Enrollment::factory()->create([
            'student_id' => $student->id,
            'school_class_id' => $class->id,
            'status' => 'active',
            'start_date' => now()->subMonths(2),
        ]);

        // Generate invoices for this month
        $action = new GenerateMonthlyInvoicesAction();
        $action->execute(now()->month, now()->year);

        $invoice = Invoice::where('student_id', $student->id)->first();
        $this->assertNotNull($invoice);
        $originalTotal = $invoice->total_amount_centimes;

        // End enrollment mid-month
        $this->actingAs($this->admin)
            ->postJson("/api/enrollments/{$enrollment->id}/end")
            ->assertOk();

        // Verify invoice is untouched
        $invoice->refresh();
        $this->assertEquals($originalTotal, $invoice->total_amount_centimes);
        $this->assertEquals('unpaid', $invoice->status);
    }

    /**
     * 6.1.3 - Soft-deleting a teacher with active classes is blocked (422).
     */
    public function test_cannot_delete_teacher_with_active_classes(): void
    {
        $teacher = Teacher::factory()->create();
        $subject = Subject::factory()->create();
        SchoolClass::factory()->create([
            'teacher_id' => $teacher->id,
            'subject_id' => $subject->id,
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->admin)
            ->deleteJson("/api/teachers/{$teacher->id}");

        $response->assertStatus(422);
        $response->assertJsonFragment([
            'message' => 'Cannot delete teacher. Please reassign their active classes first.',
        ]);

        // Teacher should NOT be soft-deleted
        $this->assertDatabaseHas('teachers', ['id' => $teacher->id, 'deleted_at' => null]);
    }

    /**
     * 6.1.3b - Soft-deleting a teacher with NO active classes succeeds.
     */
    public function test_can_delete_teacher_without_active_classes(): void
    {
        $teacher = Teacher::factory()->create();

        $response = $this->actingAs($this->admin)
            ->deleteJson("/api/teachers/{$teacher->id}");

        $response->assertNoContent();
        $this->assertSoftDeleted('teachers', ['id' => $teacher->id]);
    }

    /**
     * 6.1.4 - Double-submission of invoice generation creates zero duplicates.
     */
    public function test_idempotent_invoice_generation(): void
    {
        $subject = Subject::factory()->create(['default_price_centimes' => 50000]);
        $teacher = Teacher::factory()->create();
        $class = SchoolClass::factory()->create([
            'subject_id' => $subject->id,
            'teacher_id' => $teacher->id,
            'is_active' => true,
        ]);
        $student = Student::factory()->create();
        Enrollment::factory()->create([
            'student_id' => $student->id,
            'school_class_id' => $class->id,
            'status' => 'active',
            'start_date' => now()->subMonth(),
        ]);

        $action = new GenerateMonthlyInvoicesAction();

        // First call
        $result1 = $action->execute(now()->month, now()->year);
        $this->assertEquals(1, $result1['generated']);

        // Second call (rapid double-submission)
        $result2 = $action->execute(now()->month, now()->year);
        $this->assertEquals(0, $result2['generated']);

        // Only 1 invoice in the database
        $this->assertDatabaseCount('invoices', 1);
    }
}
