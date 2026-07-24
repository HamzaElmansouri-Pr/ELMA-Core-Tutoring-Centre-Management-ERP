<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;

class BackupController extends Controller
{
    public function export()
    {
        $dbPath = database_path('database.sqlite');

        if (!file_exists($dbPath)) {
            return response()->json(['message' => 'Database file not found.'], 404);
        }

        $timestamp = now()->format('Y-m-d');
        $filename = "elma-backup-{$timestamp}.sqlite";

        return response()->download($dbPath, $filename, [
            'Content-Type' => 'application/x-sqlite3',
        ]);
    }
}
