<?php

use Illuminate\Support\Facades\Route;

Route::get('/', fn () => response()->json(['name' => 'Brandville Dashboard API', 'status' => 'ok']));
