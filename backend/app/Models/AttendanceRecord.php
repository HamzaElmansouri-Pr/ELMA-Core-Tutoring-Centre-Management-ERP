<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

class AttendanceRecord extends Model
{
    use HasFactory, SoftDeletes, LogsActivity;

    protected $fillable = ['enrollment_id', 'session_date', 'status'];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logFillable();
    }

    public function enrollment()
    {
        return $this->belongsTo(Enrollment::class);
    }
}
