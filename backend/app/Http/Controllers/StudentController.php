<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Http\Resources\StudentResource;
use App\Http\Requests\StoreStudentRequest;
use App\Http\Requests\UpdateStudentRequest;

class StudentController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return StudentResource::collection(Student::withCount(['activeEnrollments', 'unpaidInvoices'])->latest()->get());
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreStudentRequest $request)
    {
        $student = Student::create($request->validated());
        return new StudentResource($student->loadCount(['activeEnrollments', 'unpaidInvoices']));
    }

    /**
     * Display the specified resource.
     */
    public function show(Student $student)
    {
        return new StudentResource($student->loadCount(['activeEnrollments', 'unpaidInvoices']));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateStudentRequest $request, Student $student)
    {
        $student->update($request->validated());
        return new StudentResource($student->loadCount(['activeEnrollments', 'unpaidInvoices']));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Student $student)
    {
        $student->delete();
        return response()->noContent();
    }
}
