<?php

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\FotoController;
use App\Http\Middleware\SPAMiddleware;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('App');
});

Route::middleware([SPAMiddleware::class])->prefix('spa')->name('spa.')->group(function() {
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

        Route::name('game.')->prefix('game')->group(function() {
            Route::post('fotos', [FotoController::class, 'index'])
                ->name('fotos');
            Route::get('foto/show/{id}', [FotoController::class, 'show'])
                ->withoutMiddleware([SPAMiddleware::class])
                ->name('foto.show');
        });
    });
});

Route::get('/{any}', function () {
    return view('App');
})->where('any', '.*');
