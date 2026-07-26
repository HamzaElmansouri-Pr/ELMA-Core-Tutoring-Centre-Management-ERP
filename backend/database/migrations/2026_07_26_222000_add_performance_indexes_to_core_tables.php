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
            $table->index('first_name');
            $table->index('last_name');
            $table->index('parent_phone');
        });

        Schema::table('enrollments', function (Blueprint $table) {
            $table->index('status');
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->index('status');
            $table->index(['month', 'year']);
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->index('type');
            $table->index('created_at');
        });

        Schema::table('class_sessions', function (Blueprint $table) {
            $table->index('day_of_week');
        });

        Schema::table('school_classes', function (Blueprint $table) {
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropIndex(['first_name']);
            $table->dropIndex(['last_name']);
            $table->dropIndex(['parent_phone']);
        });

        Schema::table('enrollments', function (Blueprint $table) {
            $table->dropIndex(['status']);
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropIndex(['month', 'year']);
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->dropIndex(['type']);
            $table->dropIndex(['created_at']);
        });

        Schema::table('class_sessions', function (Blueprint $table) {
            $table->dropIndex(['day_of_week']);
        });

        Schema::table('school_classes', function (Blueprint $table) {
            $table->dropIndex(['is_active']);
        });
    }
};
