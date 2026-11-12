<?php

use App\Http\Controllers\Auth\EmployeeAuthController;
use App\Http\Controllers\ManagementAuthController;
use App\Http\Controllers\ManagementController;
use App\Http\Controllers\SuggestionController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->name('auth.')->group(function (): void {
    Route::post('/register', [EmployeeAuthController::class, 'register'])->name('register');
    Route::post('/verify-email', [EmployeeAuthController::class, 'verifyEmail'])->name('verify-email');
    Route::post('/resend-verification-otp', [EmployeeAuthController::class, 'resendVerificationOtp'])->middleware('throttle:3,1')->name('resend-verification-otp');
    Route::post('/forgot-password', [EmployeeAuthController::class, 'forgotPassword'])->middleware('throttle:3,1')->name('forgot-password');
    Route::post('/reset-password', [EmployeeAuthController::class, 'resetPassword'])->name('reset-password');
    Route::post('/login', [EmployeeAuthController::class, 'login'])->middleware('throttle:5,1')->name('login');
    Route::post('/logout', [EmployeeAuthController::class, 'logout'])->middleware('auth')->name('logout');
    Route::get('/user', [EmployeeAuthController::class, 'user'])->middleware('auth')->name('user');
});

Route::middleware('auth')->prefix('suggestions')->name('suggestions.')->group(function (): void {
    Route::get('/categories', [SuggestionController::class, 'categories'])->name('categories');
    Route::get('/attachments/{attachment}/open', [SuggestionController::class, 'openAttachment'])->name('attachments.open');
    Route::get('/', [SuggestionController::class, 'index'])->name('index');
    Route::post('/', [SuggestionController::class, 'store'])->name('store');
    Route::post('/claim-anonymous', [SuggestionController::class, 'claimAnonymous'])->name('claim-anonymous');
});

Route::prefix('management')->name('management.')->group(function (): void {
    Route::post('/auth/login', [ManagementAuthController::class, 'login'])->middleware('throttle:5,1')->name('auth.login');
    Route::middleware(['auth', 'role:management,super_admin'])->group(function (): void {
        Route::get('/auth/user', [ManagementAuthController::class, 'user'])->name('auth.user');
        Route::post('/auth/logout', [ManagementAuthController::class, 'logout'])->name('auth.logout');
        Route::get('/dashboard', [ManagementController::class, 'dashboard'])->middleware('permission:ticket.view')->name('dashboard');
        Route::get('/notifications', [ManagementController::class, 'notifications'])->middleware('permission:ticket.view')->name('notifications.index');
        Route::patch('/notifications/{notification}/read', [ManagementController::class, 'markNotificationRead'])->middleware('permission:ticket.view')->whereUuid('notification')->name('notifications.read');
        Route::get('/suggestions', [ManagementController::class, 'suggestions'])->middleware('permission:ticket.view')->name('suggestions.index');
        Route::get('/suggestions/{suggestion}', [ManagementController::class, 'showSuggestion'])->middleware('permission:ticket.view')->name('suggestions.show');
        Route::post('/suggestions/{suggestion}/messages', [ManagementController::class, 'storeMessage'])->middleware('permission:ticket.reply')->name('suggestions.messages.store');
        Route::patch('/suggestions/{suggestion}/workflow', [ManagementController::class, 'updateWorkflow'])->middleware('permission:ticket.update')->name('suggestions.workflow.update');
        Route::patch('/suggestions/{suggestion}/route', [ManagementController::class, 'routeSuggestion'])->middleware('permission:ticket.assign')->name('suggestions.route');
        Route::get('/ticket-categories', [ManagementController::class, 'categories'])->middleware('permission:ticket.view')->name('ticket-categories.index');
    });
    Route::middleware(['auth', 'role:super_admin'])->group(function (): void {
        Route::get('/categories', [ManagementController::class, 'categories'])->name('categories.index');
        Route::post('/categories', [ManagementController::class, 'storeCategory'])->name('categories.store');
        Route::patch('/categories/{category}', [ManagementController::class, 'updateCategory'])->name('categories.update');
        Route::delete('/categories/{category}', [ManagementController::class, 'destroyCategory'])->name('categories.destroy');
        Route::get('/users', [ManagementController::class, 'managementUsers'])->name('users.index');
        Route::post('/users', [ManagementController::class, 'storeManagementUser'])->name('users.store');
        Route::patch('/users/{user}/access', [ManagementController::class, 'updateUserAccess'])->name('users.access.update');
        Route::get('/roles', [ManagementController::class, 'roles'])->name('roles.index');
        Route::post('/roles', [ManagementController::class, 'storeRole'])->name('roles.store');
        Route::patch('/roles/{role}', [ManagementController::class, 'updateRole'])->name('roles.update');
        Route::delete('/roles/{role}', [ManagementController::class, 'destroyRole'])->name('roles.destroy');
    });
});

Route::get('/', function () {
    return view('welcome');
});

Route::get('/management', function () {
    return view('management');
})->middleware(['auth', 'role:management,super_admin']);

Route::get('/management/login', function () {
    return view('management');
})->middleware('guest')->name('management.login');

Route::get('/reset-password/{token}', function () {
    return view('welcome');
})->middleware('guest')->name('password.reset');
