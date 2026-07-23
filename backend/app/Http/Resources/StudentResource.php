<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StudentResource extends JsonResource
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
            'parent_phone' => $this->parent_phone,
            'active_enrollments_count' => $this->whenCounted('activeEnrollments'),
            'unpaid_invoices_count' => $this->whenCounted('unpaidInvoices'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
