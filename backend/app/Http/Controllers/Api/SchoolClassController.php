<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SchoolClass;
use Illuminate\Http\Request;
use App\Http\Resources\SchoolClassResource;
use App\Http\Requests\StoreSchoolClassRequest;
use App\Http\Requests\UpdateSchoolClassRequest;

class SchoolClassController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = SchoolClass::with(['subject:id,name', 'teacher:id,name,email,phone'])->withCount('enrollments');

        if ($request->filled('search')) {
            $search = trim($request->input('search'));
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhereHas('subject', function ($sq) use ($search) {
                      $sq->where('name', 'like', "%{$search}%");
                  })
                  ->orWhereHas('teacher', function ($tq) use ($search) {
                      $tq->where('name', 'like', "%{$search}%");
                  });
            });
        }

        $perPage = (int) $request->input('per_page', 15);
        if ($perPage < 1 || $perPage > 100) {
            $perPage = 15;
        }

        return SchoolClassResource::collection($query->latest()->paginate($perPage));
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreSchoolClassRequest $request)
    {
        $validated = $request->validated();
        
        if (empty($validated['name'])) {
            $validated['name'] = $this->generateClassName($validated['subject_id'], $validated['teacher_id']);
        }

        $schoolClass = SchoolClass::create($validated);
        return new SchoolClassResource($schoolClass->load(['subject', 'teacher']));
    }

    /**
     * Display the specified resource.
     */
    public function show(SchoolClass $schoolClass)
    {
        return new SchoolClassResource($schoolClass->load(['subject', 'teacher']));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateSchoolClassRequest $request, SchoolClass $schoolClass)
    {
        $validated = $request->validated();
        
        if (array_key_exists('name', $validated) && empty($validated['name'])) {
            $subjectId = $validated['subject_id'] ?? $schoolClass->subject_id;
            $teacherId = $validated['teacher_id'] ?? $schoolClass->teacher_id;
            $validated['name'] = $this->generateClassName($subjectId, $teacherId, $schoolClass->id);
        }

        $schoolClass->update($validated);
        return new SchoolClassResource($schoolClass->load(['subject', 'teacher']));
    }

    private function generateClassName($subjectId, $teacherId, $excludeClassId = null)
    {
        $subject = \App\Models\Subject::find($subjectId);
        $teacher = \App\Models\Teacher::find($teacherId);
        
        $query = SchoolClass::where('subject_id', $subjectId)
                            ->where('teacher_id', $teacherId)
                            ->withTrashed();
                            
        if ($excludeClassId) {
            $query->where('id', '!=', $excludeClassId);
        }
        
        $count = $query->count();
        $groupNumber = $count + 1;
        
        $subjectName = $subject ? $subject->name : 'Subject';
        $teacherName = $teacher ? $teacher->name : 'Teacher';
        
        return "{$subjectName} - {$teacherName} - G{$groupNumber}";
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(SchoolClass $schoolClass)
    {
        $schoolClass->delete();
        return response()->noContent();
    }
}
