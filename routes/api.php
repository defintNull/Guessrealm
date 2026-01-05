<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/profile', [App\Http\Controllers\ProfileController::class, 'show']);
    Route::post('/profile', [App\Http\Controllers\ProfileController::class, 'update']);
});
