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
        Schema::table('students', function (Blueprint $table) {
            $table->index('first_name', 'idx_students_first_name');
            $table->index('last_name', 'idx_students_last_name');
            $table->index('parent_phone', 'idx_students_parent_phone');
        });

        Schema::table('teachers', function (Blueprint $table) {
            $table->index('name', 'idx_teachers_name');
            $table->index('phone', 'idx_teachers_phone');
            $table->index('whatsapp_phone', 'idx_teachers_whatsapp_phone');
        });

        Schema::table('school_classes', function (Blueprint $table) {
            $table->index('name', 'idx_school_classes_name');
        });

        Schema::table('subjects', function (Blueprint $table) {
            $table->index('name', 'idx_subjects_name');
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->index(['status', 'year', 'month'], 'idx_invoices_status_year_month');
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->index('payment_method', 'idx_payments_payment_method');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropIndex('idx_students_first_name');
            $table->dropIndex('idx_students_last_name');
            $table->dropIndex('idx_students_parent_phone');
        });

        Schema::table('teachers', function (Blueprint $table) {
            $table->dropIndex('idx_teachers_name');
            $table->dropIndex('idx_teachers_phone');
            $table->dropIndex('idx_teachers_whatsapp_phone');
        });

        Schema::table('school_classes', function (Blueprint $table) {
            $table->dropIndex('idx_school_classes_name');
        });

        Schema::table('subjects', function (Blueprint $table) {
            $table->dropIndex('idx_subjects_name');
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->dropIndex('idx_invoices_status_year_month');
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->dropIndex('idx_payments_payment_method');
        });
    }
};
