<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

class PayrollRecord extends Model
{
    use SoftDeletes, LogsActivity;

    protected $fillable = [
        'teacher_id',
        'month',
        'year',
        'gross_collected_centimes',
        'commission_percentage',
        'payout_amount_centimes',
        'breakdown',
        'status',
    ];

    protected $casts = [
        'breakdown' => 'array',
    ];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()->logFillable();
    }

    public function teacher()
    {
        return $this->belongsTo(Teacher::class);
    }
}
