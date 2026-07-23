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

    public function activeEnrollments()
    {
        // Placeholder for future relationship
        return $this->hasMany(Student::class, 'id', 'id')->whereRaw('1=0');
    }

    public function unpaidInvoices()
    {
        // Placeholder for future relationship
        return $this->hasMany(Student::class, 'id', 'id')->whereRaw('1=0');
    }
}
