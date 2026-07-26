<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SchoolClassResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'subject_id' => $this->subject_id,
            'teacher_id' => $this->teacher_id,
            'price_centimes' => $this->price_centimes,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'subject' => new \App\Http\Resources\SubjectResource($this->whenLoaded('subject')),
            'teacher' => new \App\Http\Resources\TeacherResource($this->whenLoaded('teacher')),
            'sessions' => $this->whenLoaded('sessions'),
            'enrollments_count' => $this->whenCounted('enrollments'),
        ];
    }
}
