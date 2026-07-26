<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;

Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    
    Route::get('teachers/all', [\App\Http\Controllers\TeacherController::class, 'all']);
    Route::apiResource('teachers', \App\Http\Controllers\TeacherController::class);
    Route::get('students/search', [\App\Http\Controllers\StudentController::class, 'search']);
    Route::post('students/{student}/bulk-enroll', [\App\Http\Controllers\StudentController::class, 'bulkEnroll']);
    Route::apiResource('students', \App\Http\Controllers\StudentController::class);
    Route::get('subjects/all', [\App\Http\Controllers\Api\SubjectController::class, 'all']);
    Route::apiResource('subjects', \App\Http\Controllers\Api\SubjectController::class);
    Route::apiResource('school-classes', \App\Http\Controllers\Api\SchoolClassController::class);
    
    Route::post('enrollments', [\App\Http\Controllers\Api\EnrollmentController::class, 'store']);
    Route::post('enrollments/{enrollment}/end', [\App\Http\Controllers\Api\EnrollmentController::class, 'end']);
    Route::delete('enrollments/{enrollment}', [\App\Http\Controllers\Api\EnrollmentController::class, 'destroy']);

    Route::post('invoices/generate', [\App\Http\Controllers\Api\InvoiceController::class, 'generate']);
    Route::apiResource('invoices', \App\Http\Controllers\Api\InvoiceController::class)->only(['index', 'show']);
    Route::post('invoices/{invoice}/payments', [\App\Http\Controllers\Api\PaymentController::class, 'store']);
    Route::get('/students/{student}/invoices', [\App\Http\Controllers\Api\PaymentController::class, 'getStudentInvoices']);
    Route::get('/payments', [\App\Http\Controllers\Api\PaymentController::class, 'index']);
    Route::post('/payments', [\App\Http\Controllers\Api\PaymentController::class, 'store']);
    Route::get('/payments/{payment}/receipt', [\App\Http\Controllers\Api\PaymentController::class, 'downloadReceipt']);

    Route::get('payroll', [\App\Http\Controllers\Api\PayrollController::class, 'index']);
    Route::post('payroll/calculate', [\App\Http\Controllers\Api\PayrollController::class, 'calculate']);
    Route::post('payroll/{record}/mark-paid', [\App\Http\Controllers\Api\PayrollController::class, 'markPaid']);

    Route::get('timetable', [\App\Http\Controllers\Api\TimetableController::class, 'index']);
    Route::get('attendance/{class_id}/{session_date}', [\App\Http\Controllers\Api\AttendanceController::class, 'show']);
    Route::post('attendance', [\App\Http\Controllers\Api\AttendanceController::class, 'upsert']);

    Route::get('settings', [\App\Http\Controllers\Api\SettingsController::class, 'index']);
    Route::post('settings', [\App\Http\Controllers\Api\SettingsController::class, 'store']);

    Route::get('dashboard/kpis', [\App\Http\Controllers\Api\DashboardController::class, 'kpis']);
    Route::get('dashboard/unpaid-alerts', [\App\Http\Controllers\Api\DashboardController::class, 'unpaidAlerts']);
    Route::get('dashboard/profit-breakdown', [\App\Http\Controllers\Api\DashboardController::class, 'profitBreakdown']);

    Route::get('backup/export', [\App\Http\Controllers\Api\BackupController::class, 'export']);
});
