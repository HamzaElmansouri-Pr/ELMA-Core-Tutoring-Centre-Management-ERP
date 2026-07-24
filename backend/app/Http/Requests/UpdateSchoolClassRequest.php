<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateSchoolClassRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'subject_id' => ['sometimes', 'required', 'exists:subjects,id,deleted_at,NULL'],
            'teacher_id' => ['sometimes', 'required', 'exists:teachers,id,deleted_at,NULL'],
            'schedule_info' => ['sometimes', 'required', 'array'],
            'schedule_info.*.day' => ['required_with:schedule_info', 'string'],
            'schedule_info.*.start' => ['required_with:schedule_info', 'string', 'date_format:H:i'],
            'schedule_info.*.end' => ['required_with:schedule_info', 'string', 'date_format:H:i', 'after:schedule_info.*.start'],
        ];
    }
}
