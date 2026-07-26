<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreSchoolClassRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'subject_id' => ['required', 'exists:subjects,id,deleted_at,NULL'],
            'teacher_id' => ['required', 'exists:teachers,id,deleted_at,NULL'],
            'price_centimes' => ['required', 'integer', 'min:0'],
        ];
    }
}
