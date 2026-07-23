<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SchoolClass;
use Illuminate\Http\Request;

class TimetableController extends Controller
{
    public function index()
    {
        $classes = SchoolClass::with(['subject', 'teacher'])->get();
        $blocks = [];

        foreach ($classes as $class) {
            if ($class->schedule_info && is_array($class->schedule_info)) {
                foreach ($class->schedule_info as $slot) {
                    $blocks[] = [
                        'class_id' => $class->id,
                        'class_name' => $class->name,
                        'subject_name' => $class->subject->name,
                        'teacher_name' => $class->teacher->name,
                        'day' => strtolower($slot['day']),
                        'start' => $slot['start'],
                        'end' => $slot['end'],
                    ];
                }
            }
        }

        return response()->json(['data' => $blocks]);
    }
}
