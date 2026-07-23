<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;
use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable(['name', 'parent_phone'])]
class Student extends Model
{
    /** @use HasFactory<\Database\Factories\StudentFactory> */
    use HasFactory, SoftDeletes, LogsActivity;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logFillable();
    }

    public function enrollments()
    {
        return $this->hasMany(Enrollment::class);
    }

    public function activeEnrollments()
    {
        return $this->hasMany(Enrollment::class)->where('status', 'active');
    }

    public function invoices()
    {
        return $this->hasMany(Invoice::class);
    }

    public function unpaidInvoices()
    {
        return $this->hasMany(Invoice::class)->whereIn('status', ['unpaid', 'partial']);
    }


}
