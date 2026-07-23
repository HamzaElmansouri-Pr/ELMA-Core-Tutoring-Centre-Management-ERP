<?php

namespace App\Http\Controllers;

use App\Models\Teacher;
use App\Http\Resources\TeacherResource;
use App\Http\Requests\StoreTeacherRequest;
use App\Http\Requests\UpdateTeacherRequest;

class TeacherController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return TeacherResource::collection(Teacher::latest()->get());
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreTeacherRequest $request)
    {
        $teacher = Teacher::create($request->validated());
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
        return new TeacherResource($teacher);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Teacher $teacher)
    {
        $teacher->delete();
        return response()->noContent();
    }
}
