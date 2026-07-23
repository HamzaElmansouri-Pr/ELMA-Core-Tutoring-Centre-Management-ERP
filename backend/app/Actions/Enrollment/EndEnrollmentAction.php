<?php

namespace App\Actions\Enrollment;

use App\Models\Enrollment;
use Illuminate\Support\Facades\DB;
use Exception;

class EndEnrollmentAction
{
    public function execute(Enrollment $enrollment, ?string $endDate = null): Enrollment
    {
        if ($enrollment->status === 'ended') {
            throw new Exception('Enrollment is already ended.');
        }

        return DB::transaction(function () use ($enrollment, $endDate) {
            $enrollment->update([
                'status' => 'ended',
                'end_date' => $endDate ?? now()->toDateString(),
            ]);

            return $enrollment;
        });
    }
}
