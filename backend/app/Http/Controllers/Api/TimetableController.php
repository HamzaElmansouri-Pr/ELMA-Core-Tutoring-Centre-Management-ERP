<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SchoolClass;
use Illuminate\Http\Request;

class TimetableController extends Controller
{
    public function index()
    {
        $classes = SchoolClass::with(['subject', 'teacher', 'sessions'])->get();
        $blocks = [];

        foreach ($classes as $class) {
            foreach ($class->sessions as $session) {
                $blocks[] = [
                    'class_id' => $class->id,
                    'class_name' => $class->name,
                    'subject_name' => $class->subject->name,
                    'teacher_name' => $class->teacher->name,
                    'day' => strtolower($session->day_of_week),
                    'start' => substr($session->start_time, 0, 5), // e.g. "14:00"
                    'end' => substr($session->end_time, 0, 5),
                ];
            }
        }

        return response()->json(['data' => $blocks]);
    }
}
