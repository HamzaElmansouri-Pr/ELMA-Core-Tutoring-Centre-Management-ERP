<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('enrollments', function (Blueprint $table) {
            $table->index(['student_id', 'status'], 'idx_enroll_student_status');
            $table->index(['school_class_id', 'status'], 'idx_enroll_class_status');
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->index(['student_id', 'status'], 'idx_inv_student_status');
        });

        Schema::table('school_classes', function (Blueprint $table) {
            $table->index(['teacher_id', 'is_active'], 'idx_class_teacher_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('enrollments', function (Blueprint $table) {
            $table->dropIndex('idx_enroll_student_status');
            $table->dropIndex('idx_enroll_class_status');
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->dropIndex('idx_inv_student_status');
        });

        Schema::table('school_classes', function (Blueprint $table) {
            $table->dropIndex('idx_class_teacher_active');
        });
    }
};
