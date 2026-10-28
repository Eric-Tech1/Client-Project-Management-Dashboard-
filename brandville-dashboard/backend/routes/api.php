<?php

use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\ProjectController;
use Illuminate\Support\Facades\Route;

Route::get('/dashboard', [DashboardController::class, 'index']);
Route::apiResource('projects', ProjectController::class);
