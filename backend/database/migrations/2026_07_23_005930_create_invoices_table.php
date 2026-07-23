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
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students');
            $table->integer('month');
            $table->integer('year');
            $table->integer('total_amount_centimes');
            $table->integer('paid_amount_centimes')->default(0);
            $table->string('status')->default('unpaid'); // unpaid, partial, paid
            $table->timestamps();
            $table->softDeletes();
            
            // Unique constraint to ensure idempotence per student per month
            $table->unique(['student_id', 'month', 'year']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
