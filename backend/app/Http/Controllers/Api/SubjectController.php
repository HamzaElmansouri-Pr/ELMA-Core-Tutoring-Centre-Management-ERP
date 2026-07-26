<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Subject;
use Illuminate\Http\Request;
use App\Http\Requests\StoreSubjectRequest;
use App\Http\Requests\UpdateSubjectRequest;
use App\Http\Resources\SubjectResource;
use Illuminate\Support\Facades\Cache;

class SubjectController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Subject::query();

        if ($request->filled('search')) {
            $search = trim($request->input('search'));
            $query->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
        }

        $perPage = (int) $request->input('per_page', 15);
        if ($perPage < 1 || $perPage > 100) {
            $perPage = 15;
        }

        return SubjectResource::collection($query->orderBy('name')->paginate($perPage));
    }

    /**
     * Get all subjects for form dropdowns (cached).
     */
    public function all()
    {
        $subjects = Cache::rememberForever('subjects_all', function () {
            return Subject::orderBy('name')->get();
        });

        return SubjectResource::collection($subjects);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreSubjectRequest $request)
    {
        $subject = Subject::create($request->validated());
        Cache::forget('subjects_all');
        return new SubjectResource($subject);
    }

    /**
     * Display the specified resource.
     */
    public function show(Subject $subject)
    {
        return new SubjectResource($subject);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateSubjectRequest $request, Subject $subject)
    {
        $subject->update($request->validated());
        Cache::forget('subjects_all');
        return new SubjectResource($subject);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Subject $subject)
    {
        $subject->delete();
        Cache::forget('subjects_all');
        return response()->noContent();
    }
}
