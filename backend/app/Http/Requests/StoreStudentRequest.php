<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreStudentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation()
    {
        if ($this->has('name')) {
            $parts = explode(' ', $this->name, 2);
            $this->merge([
                'first_name' => $parts[0] ?? '',
                'last_name' => $parts[1] ?? 'Doe', // fallback if no last name
            ]);
        }
    }

    public function rules(): array
    {
        return [
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'parent_phone' => ['nullable', 'string', 'max:20'],
        ];
    }
}
