<?php

use App\Http\Controllers\Auth\AuthController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('App');
});

Route::post("/login", [AuthController::class, 'login'])
    ->middleware('throttle:login')
    ->name('login');

Route::post("/register", [AuthController::class, 'register'])
    ->middleware('throttle:register')
    ->name('register');

Route::get('/{any}', function () {
    return view('App');
})->where('any', '.*');
