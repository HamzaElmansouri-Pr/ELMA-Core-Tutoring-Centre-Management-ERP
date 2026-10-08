<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreBatchPaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'student_id' => ['required', 'integer', 'exists:students,id'],
            'invoices' => ['required', 'array', 'min:1'],
            'invoices.*.invoice_id' => ['required', 'integer', 'distinct', 'exists:invoices,id'],
            'invoices.*.amount_centimes' => ['required', 'integer', 'min:0'],
            'invoices.*.discount_centimes' => ['nullable', 'integer', 'min:0'],
            'invoices.*.discount_reason' => ['nullable', 'string', 'max:1000'],
            'payment_method' => ['required', 'string', 'max:50'],
        ];
    }
}
