<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payroll_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('teacher_id')->constrained()->onDelete('cascade');
            $table->integer('month');
            $table->integer('year');
            $table->integer('gross_collected_centimes');
            $table->decimal('commission_percentage', 5, 2);
            $table->integer('payout_amount_centimes');
            $table->json('breakdown')->nullable();
            $table->string('status')->default('calculated');
            $table->timestamps();
            $table->softDeletes();
            $table->unique(['teacher_id', 'month', 'year']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payroll_records');
    }
};
