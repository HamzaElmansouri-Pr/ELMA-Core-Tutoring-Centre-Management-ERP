<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;

Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    
    Route::apiResource('teachers', \App\Http\Controllers\TeacherController::class);
    Route::apiResource('students', \App\Http\Controllers\StudentController::class);
    Route::apiResource('subjects', \App\Http\Controllers\Api\SubjectController::class);
    Route::apiResource('school-classes', \App\Http\Controllers\Api\SchoolClassController::class);
    
    Route::post('enrollments', [\App\Http\Controllers\Api\EnrollmentController::class, 'store']);
    Route::post('enrollments/{enrollment}/end', [\App\Http\Controllers\Api\EnrollmentController::class, 'end']);
    Route::delete('enrollments/{enrollment}', [\App\Http\Controllers\Api\EnrollmentController::class, 'destroy']);

    Route::post('invoices/generate', [\App\Http\Controllers\Api\InvoiceController::class, 'generate']);
    Route::apiResource('invoices', \App\Http\Controllers\Api\InvoiceController::class)->only(['index', 'show']);
    Route::post('invoices/{invoice}/payments', [\App\Http\Controllers\Api\PaymentController::class, 'store']);

    Route::get('payroll', [\App\Http\Controllers\Api\PayrollController::class, 'index']);
    Route::post('payroll/calculate', [\App\Http\Controllers\Api\PayrollController::class, 'calculate']);
    Route::post('payroll/{record}/mark-paid', [\App\Http\Controllers\Api\PayrollController::class, 'markPaid']);
});
