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

        // Students & Enrollments
        $students = \App\Models\Student::factory(50)->create();
        foreach ($students as $student) {
            // Enroll in 1-3 random classes
            $studentClasses = fake()->randomElements($classes, rand(1, 3));
            foreach ($studentClasses as $cls) {
                \App\Models\Enrollment::create([
                    'student_id' => $student->id,
                    'school_class_id' => $cls->id,
                    'start_date' => now()->subDays(rand(1, 30))->format('Y-m-d'),
                    'status' => 'active'
                ]);
            }
        }
    }
}
