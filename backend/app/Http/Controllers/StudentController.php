<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Http\Resources\StudentResource;
use App\Http\Requests\StoreStudentRequest;
use App\Http\Requests\UpdateStudentRequest;
use App\Actions\BulkEnrollmentAction;
use Illuminate\Http\Request;

class StudentController extends Controller
{
    /**
     * Search for students by first_name, last_name, or parent_phone
     */
    public function search(Request $request)
    {
        $query = $request->input('q', '');
        
        if (empty($query)) {
            return response()->json([]);
        }

        $students = Student::where('first_name', 'like', "%{$query}%")
            ->orWhere('last_name', 'like', "%{$query}%")
            ->orWhere('parent_phone', 'like', "%{$query}%")
            ->limit(10)
            ->get();

        return StudentResource::collection($students);
    }

    /**
     * Bulk enroll a student into multiple classes
     */
    public function bulkEnroll(Request $request, Student $student, BulkEnrollmentAction $action)
    {
        $validated = $request->validate([
            'class_ids' => ['required', 'array'],
            'class_ids.*' => ['integer', 'exists:school_classes,id'],
            'start_date' => ['nullable', 'date'],
        ]);

        $result = $action->execute($student, $validated['class_ids'], $validated['start_date'] ?? null);

        return response()->json($result);
    }
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
        return new StudentResource($student->load('enrollments.schoolClass.subject', 'enrollments.schoolClass.teacher')->loadCount(['activeEnrollments', 'unpaidInvoices']));
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
