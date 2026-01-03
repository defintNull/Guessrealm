<?php

use App\Http\Controllers\Auth\AuthController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('App');
});

Route::middleware('guest')->group(function() {
    Route::post("/login", [AuthController::class, 'login'])
        ->middleware('throttle:login')
        ->name('login');

    Route::post("/register", [AuthController::class, 'register'])
        ->middleware('throttle:register')
        ->name('register');
});

Route::middleware('auth')->group(function() {
    Route::get("/me", [AuthController::class, 'me'])
        ->name('me');

    Route::post('/logout', [AuthController::class, 'logout'])
        ->name('logout');

    Route::get('/profilepicture', [AuthController::class, 'profilePicture'])
        ->name('profile_picture');
});

Route::get('/{any}', function () {
    return view('App');
})->where('any', '.*');
