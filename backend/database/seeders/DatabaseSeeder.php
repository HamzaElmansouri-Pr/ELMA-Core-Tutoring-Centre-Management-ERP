<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Admin User
        User::factory()->create([
            'name' => 'Admin',
            'email' => 'test@example.com',
            'password' => bcrypt('password'),
        ]);

        // Teachers
        $teachers = \App\Models\Teacher::factory(10)->create();

        // Subjects
        $subjects = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'French', 'History'];
        $subjectModels = [];
        foreach ($subjects as $name) {
            $subjectModels[] = \App\Models\Subject::create([
                'name' => $name, 
                'description' => "$name course",
            ]);
        }

        // Classrooms
        $classrooms = [];
        for ($i = 1; $i <= 5; $i++) {
            $classrooms[] = \App\Models\Classroom::create([
                'name' => "Room $i",
                'capacity' => rand(20, 40)
            ]);
        }

        // School Classes
        $classes = [];
        foreach ($teachers as $teacher) {
            $subject = fake()->randomElement($subjectModels);
            $schoolClass = \App\Models\SchoolClass::create([
                'name' => $subject->name . ' - ' . $teacher->name . ' - Group 1',
                'subject_id' => $subject->id,
                'teacher_id' => $teacher->id,
                'price_centimes' => rand(2000, 5000) * 100 // 2000-5000 DA
            ]);
            $classes[] = $schoolClass;

            // Seed sessions for this class
            \App\Models\ClassSession::create([
                'school_class_id' => $schoolClass->id,
                'classroom_id' => fake()->randomElement($classrooms)->id,
                'day_of_week' => 'Monday',
                'start_time' => '10:00:00',
                'end_time' => '12:00:00',
            ]);
            \App\Models\ClassSession::create([
                'school_class_id' => $schoolClass->id,
                'classroom_id' => fake()->randomElement($classrooms)->id,
                'day_of_week' => 'Wednesday',
                'start_time' => '10:00:00',
                'end_time' => '12:00:00',
            ]);
        }

        // Students, Enrollments, Invoices, Payments & Attendance
        $students = \App\Models\Student::factory(100)->create();
        $currentMonth = now()->month;
        $currentYear = now()->year;
        
        foreach ($students as $student) {
            // Enroll in 1-4 random classes
            $studentClasses = fake()->randomElements($classes, rand(1, 4));
            $invoiceAmount = 0;
            
            foreach ($studentClasses as $cls) {
                $enrollment = \App\Models\Enrollment::create([
                    'student_id' => $student->id,
                    'school_class_id' => $cls->id,
                    'start_date' => now()->subDays(rand(30, 90))->format('Y-m-d'),
                    'status' => 'active'
                ]);

                // Generate attendance for the last 4 weeks
                for ($i = 0; $i < 4; $i++) {
                    \App\Models\AttendanceRecord::create([
                        'enrollment_id' => $enrollment->id,
                        'session_date' => now()->subDays($i * 7)->format('Y-m-d'),
                        'status' => fake()->randomElement(['present', 'present', 'present', 'present', 'absent', 'late'])
                    ]);
                }
                
                $invoiceAmount += $cls->price_centimes;
            }

            // Create past and current month invoices to show a trend
            for ($m = 0; $m < 3; $m++) {
                $month = now()->subMonths($m);
                
                // Randomly some are unpaid
                $isPaid = rand(0, 10) > 2; // 80% paid
                $paidAmount = $isPaid ? $invoiceAmount : 0;
                $status = $isPaid ? 'paid' : 'unpaid';
                
                $invoice = \App\Models\Invoice::create([
                    'student_id' => $student->id,
                    'month' => $month->month,
                    'year' => $month->year,
                    'total_amount_centimes' => $invoiceAmount,
                    'paid_amount_centimes' => $paidAmount,
                    'status' => $status,
                ]);

                $invoiceItems = [];
                foreach ($studentClasses as $cls) {
                    $invoiceItems[] = \App\Models\InvoiceItem::create([
                        'invoice_id' => $invoice->id,
                        'school_class_id' => $cls->id,
                        'amount_centimes' => $cls->price_centimes,
                        'paid_amount_centimes' => $isPaid ? $cls->price_centimes : 0,
                    ]);
                }

                if ($isPaid) {
                    $payment = \App\Models\Payment::create([
                        'invoice_id' => $invoice->id,
                        'amount_centimes' => $invoiceAmount,
                        'type' => 'payment',
                        'payment_method' => fake()->randomElement(['cash', 'cash', 'card', 'transfer']),
                        'created_at' => $month->copy()->addDays(rand(1, 10)),
                    ]);

                    foreach ($invoiceItems as $item) {
                        \App\Models\PaymentAllocation::create([
                            'payment_id' => $payment->id,
                            'invoice_item_id' => $item->id,
                            'amount_centimes' => $item->amount_centimes,
                            'created_at' => $payment->created_at,
                            'updated_at' => $payment->created_at,
                        ]);
                    }
                }
            }
        }

        // Generate Payroll Records for Teachers for the last 3 months
        foreach ($teachers as $teacher) {
            for ($m = 0; $m < 3; $m++) {
                $month = now()->subMonths($m);
                $gross = rand(80000, 300000); // 800 - 3000 DA approx maybe (wait centimes: 80,000 = 800.00 DA)
                $commission = 50.00;
                $payout = $gross * ($commission / 100);
                
                \App\Models\PayrollRecord::create([
                    'teacher_id' => $teacher->id,
                    'month' => $month->month,
                    'year' => $month->year,
                    'gross_collected_centimes' => $gross,
                    'commission_percentage' => $commission,
                    'payout_amount_centimes' => $payout,
                    'status' => 'paid',
                    'created_at' => $month->copy()->endOfMonth(),
                ]);
            }
        }
    }
}
