<?php

use App\Http\Controllers\AiController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\LobbyController;
use App\Http\Controllers\PhotoController;
use App\Http\Middleware\SPAMiddleware;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ChatController;

Route::get('/', function () {
    return view('App');
});

Route::get('avatar/{username}', [AuthController::class, 'profilePicture'])->name('user.avatar');

Route::get('/checkUsername/{username}', [AuthController::class, 'checkUsername'])
    ->name('check_username');

Route::get('/checkEmail/{email}', [AuthController::class, 'checkEmail'])
    ->name('check_email');


Route::middleware([SPAMiddleware::class])->prefix('spa')->name('spa.')->group(function () {
    Route::middleware('guest')->group(function () {
        Route::post("/login", [AuthController::class, 'login'])
            ->middleware('throttle:login')
            ->name('login');

        Route::post("/register", [AuthController::class, 'register'])
            ->middleware('throttle:register')
            ->name('register');
    });

    Route::middleware('auth:sanctum')->group(function () {
        Route::get("/me", [AuthController::class, 'me'])
            ->name('me');

        Route::post('/updatePassword', [AuthController::class, 'updatePassword'])
            ->name('updatePassword');

        Route::post('/logout', [AuthController::class, 'logout'])
            ->name('logout');

        Route::get('/profilepicture', [AuthController::class, 'profilePicture'])
            ->withoutMiddleware([SPAMiddleware::class])
            ->name('profile_picture');

        Route::get('/profile', [AuthController::class, 'profile'])
            ->withoutMiddleware([SPAMiddleware::class])
            ->name('profile');

        Route::post('/profileUpdate', [AuthController::class, 'update'])
            ->name('profile_update');

        Route::name('game.')->prefix('game')->group(function () {
            Route::post('photos', [PhotoController::class, 'index'])
                ->name('photos');
            Route::get('photo/show/{id}', [PhotoController::class, 'show'])
                ->withoutMiddleware([SPAMiddleware::class])
                ->name('photo.show');
        });

        Route::name('ai.')->prefix('ai')->group(function () {
            Route::get('aimodel', [AiController::class, 'getModel'])
                ->name('getModel');

            Route::get('aidatamodel', [AiController::class, 'getDataModel'])
                ->name('getDataModel');
        });

        Route::name('lobby.')->prefix('lobby')->group(function() {
            Route::get('index', [LobbyController::class, 'index'])
                ->name('index');

            Route::get('show', [LobbyController::class, 'show'])
                ->name('show');

            Route::get('timer', [LobbyController::class, 'timer'])
                ->name('timer');

            Route::post('createlobby', [LobbyController::class, 'createLobby'])
                ->name('createLobby');

            Route::post('deletelobby', [LobbyController::class, 'deleteLobby'])
                ->name('deleteLobby');

            Route::post('joinlobby', [LobbyController::class, 'joinLobby'])
                ->name('joinLobby');

            Route::post('exitlobby', [LobbyController::class, 'exitLobby'])
                ->name('exitLobby');

            Route::post('setready', [LobbyController::class, 'setReady'])
                ->name('setReady');
        });
    });
});

Route::get('/{any}', function () {
    return view('App');
})->where('any', '.*');
