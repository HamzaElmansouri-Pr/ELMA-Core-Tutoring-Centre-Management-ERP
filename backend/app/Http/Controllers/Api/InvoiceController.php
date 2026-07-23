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
        $query = Invoice::with(['student']);

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        if ($request->has('month')) {
            $query->where('month', $request->month);
        }
        if ($request->has('year')) {
            $query->where('year', $request->year);
        }

        return InvoiceResource::collection($query->orderBy('created_at', 'desc')->paginate(50));
    }

    public function show(Invoice $invoice)
    {
        return new InvoiceResource($invoice->load(['student', 'items.schoolClass.subject', 'items.schoolClass.teacher', 'payments']));
    }
}
