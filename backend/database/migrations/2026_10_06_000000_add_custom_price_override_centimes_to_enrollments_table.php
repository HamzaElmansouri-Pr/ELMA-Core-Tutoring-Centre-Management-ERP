<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('enrollments', function (Blueprint $table) {
            $table->unsignedInteger('custom_price_override_centimes')->nullable()->after('custom_price_override');
        });

        DB::table('enrollments')
            ->whereNotNull('custom_price_override')
            ->update([
                'custom_price_override_centimes' => DB::raw('ROUND(custom_price_override * 100)'),
            ]);
    }

    public function down(): void
    {
        Schema::table('enrollments', function (Blueprint $table) {
            $table->dropColumn('custom_price_override_centimes');
        });
    }
};
