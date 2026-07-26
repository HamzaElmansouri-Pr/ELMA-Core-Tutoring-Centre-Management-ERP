<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use Illuminate\Http\Request;
use App\Actions\Finance\GenerateMonthlyInvoicesAction;
use App\Http\Resources\InvoiceResource;

class InvoiceController extends Controller
{
    public function generate(Request $request, GenerateMonthlyInvoicesAction $action)
    {
        $data = $request->validate([
            'month' => 'required|integer|min:1|max:12',
            'year' => 'required|integer|min:2000',
        ]);

        try {
            $result = $action->execute($data['month'], $data['year']);
            return response()->json([
                'message' => "Successfully generated {$result['generated']} invoices.",
                'generated' => $result['generated'],
            ], 201);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function index(Request $request)
    {
        $query = Invoice::with(['student:id,first_name,last_name,parent_phone']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('month')) {
            $query->where('month', $request->month);
        }
        if ($request->filled('year')) {
            $query->where('year', $request->year);
        }
        if ($request->filled('search')) {
            $search = trim($request->input('search'));
            $query->where(function ($q) use ($search) {
                $q->where('id', 'like', "%{$search}%")
                  ->orWhereHas('student', function ($sq) use ($search) {
                      $sq->where('first_name', 'like', "%{$search}%")
                         ->orWhere('last_name', 'like', "%{$search}%")
                         ->orWhere('parent_phone', 'like', "%{$search}%");
                  });
            });
        }

        $perPage = (int) $request->input('per_page', 15);
        if ($perPage < 1 || $perPage > 100) {
            $perPage = 15;
        }

        return InvoiceResource::collection($query->orderBy('created_at', 'desc')->paginate($perPage));
    }

    public function show(Invoice $invoice)
    {
        return new InvoiceResource($invoice->load(['student', 'items.schoolClass.subject', 'items.schoolClass.teacher', 'payments']));
    }
}
