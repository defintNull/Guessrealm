<?php

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\PhotoController;
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
            ->withoutMiddleware([SPAMiddleware::class])
            ->name('profile_picture');

        Route::name('game.')->prefix('game')->group(function() {
            Route::post('photos', [PhotoController::class, 'index'])
                ->name('photos');
            Route::get('photo/show/{id}', [PhotoController::class, 'show'])
                ->withoutMiddleware([SPAMiddleware::class])
                ->name('photo.show');
        });
    });
});

Route::get('/{any}', function () {
    return view('App');
})->where('any', '.*');
