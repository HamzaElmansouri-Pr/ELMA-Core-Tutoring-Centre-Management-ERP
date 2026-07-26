<?php

namespace App\Http\Controllers;

use App\Models\Teacher;
use App\Http\Resources\TeacherResource;
use App\Http\Requests\StoreTeacherRequest;
use App\Http\Requests\UpdateTeacherRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class TeacherController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Teacher::query();

        if ($request->filled('search')) {
            $search = trim($request->input('search'));
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('whatsapp_phone', 'like', "%{$search}%");
            });
        }

        $perPage = (int) $request->input('per_page', 15);
        if ($perPage < 1 || $perPage > 100) {
            $perPage = 15;
        }

        return TeacherResource::collection($query->latest()->paginate($perPage));
    }

    /**
     * Get all active teachers for form dropdowns (cached).
     */
    public function all()
    {
        $teachers = Cache::rememberForever('teachers_all', function () {
            return Teacher::where('is_active', true)->orderBy('name')->get();
        });

        return TeacherResource::collection($teachers);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreTeacherRequest $request)
    {
        $teacher = Teacher::create($request->validated());
        Cache::forget('teachers_all');
        return new TeacherResource($teacher);
    }

    /**
     * Display the specified resource.
     */
    public function show(Teacher $teacher)
    {
        return new TeacherResource($teacher);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateTeacherRequest $request, Teacher $teacher)
    {
        $teacher->update($request->validated());
        Cache::forget('teachers_all');
        return new TeacherResource($teacher);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Teacher $teacher)
    {
        $activeClassCount = \App\Models\SchoolClass::where('teacher_id', $teacher->id)
            ->where('is_active', true)
            ->count();

        if ($activeClassCount > 0) {
            return response()->json([
                'message' => 'Cannot delete teacher. Please reassign their active classes first.',
            ], 422);
        }

        $teacher->delete();
        Cache::forget('teachers_all');
        return response()->noContent();
    }
}
