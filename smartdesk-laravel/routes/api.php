<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\TicketController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\PriorityController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\StatusController;
use App\Http\Controllers\Api\TicketCommentController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\PasswordResetController;
use App\Http\Controllers\Api\TicketAttachmentController;
use App\Http\Controllers\Api\ReportController;

// Public route
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');
Route::post('/forgot-password/request-code', [PasswordResetController::class, 'requestCode'])
    ->middleware('throttle:3,10');
Route::post('/forgot-password/reset', [PasswordResetController::class, 'reset'])
    ->middleware('throttle:10,10');

// Protected routes
Route::middleware(['auth:sanctum', 'active'])->group(function () {
    // Authentication and profile
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::put('/profile', [ProfileController::class, 'update']);

    Route::get('/dashboard', [DashboardController::class, 'index']);

    Route::middleware('role:Admin,Manager')->group(function () {
        Route::get('/reports/months', [ReportController::class, 'months']);
        Route::get('/reports/monthly', [ReportController::class, 'monthly']);
    });

    // In-app notifications (email delivery is handled at creation time)
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::put('/notifications/read-all', [NotificationController::class, 'markAllRead']);
    Route::put('/notifications/{id}/read', [NotificationController::class, 'markRead']);

    // Admin user management
    Route::middleware('role:Admin')->group(function () {
        Route::get('/roles', [UserController::class, 'roles']);
        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);
        Route::get('/users/{id}', [UserController::class, 'show']);
        Route::put('/users/{id}', [UserController::class, 'update']);
        Route::put('/users/{id}/ban', [UserController::class, 'setBan']);
        Route::delete('/users/{id}', [UserController::class, 'destroy']);
        Route::post('/categories', [CategoryController::class, 'store']);
        Route::put('/categories/{id}', [CategoryController::class, 'update']);
        Route::delete('/categories/{id}', [CategoryController::class, 'destroy']);
        Route::post('/priorities', [PriorityController::class, 'store']);
        Route::put('/priorities/{id}', [PriorityController::class, 'update']);
        Route::delete('/priorities/{id}', [PriorityController::class, 'destroy']);
    });

    // Tickets
    Route::get('/agents', [TicketController::class, 'agents']);
    Route::get('/tickets', [TicketController::class, 'index']);
    Route::get('/tickets/archived', [TicketController::class, 'archived']);
    Route::put('/tickets/{id}/restore', [TicketController::class, 'restore']);
    Route::get('/tickets/{id}', [TicketController::class, 'show']);
    Route::post('/tickets', [TicketController::class, 'store']);
    Route::put('/tickets/{id}', [TicketController::class, 'update']);
    Route::delete('/tickets/{id}', [TicketController::class, 'destroy']);
    Route::put('/tickets/{id}/assign', [TicketController::class, 'assign']);
    Route::put('/tickets/{id}/close', [TicketController::class, 'close']);
    Route::put('/tickets/{id}/return', [TicketController::class, 'returnTicket']);
    Route::get('/tickets/{id}/activity', [TicketController::class, 'activity']);
    Route::get('/tickets/{ticketId}/comments', [TicketCommentController::class, 'index']);
    Route::post('/tickets/{ticketId}/comments', [TicketCommentController::class, 'store']);
    Route::get('/tickets/{ticketId}/attachments', [TicketAttachmentController::class, 'index']);
    Route::post('/tickets/{ticketId}/attachments', [TicketAttachmentController::class, 'store']);
    Route::get('/attachments/{id}/download', [TicketAttachmentController::class, 'download']);
    Route::delete('/attachments/{id}', [TicketAttachmentController::class, 'destroy']);

    // Ticket form and filter options
    Route::get('/priorities', [PriorityController::class, 'index']);
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::get('/statuses', [StatusController::class, 'index']);
});
