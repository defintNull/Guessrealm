<?php

use App\Services\FakeRedis;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('lobby.{id}', function ($user, $id) {
    if (!FakeRedis::exists("lobby:$id")) {
        return false;
    }

    return
        FakeRedis::hget("lobby:$id:player1", "id") == $user->id ||
        FakeRedis::hget("lobby:$id:player2", "id") == $user->id;
});

Broadcast::channel('game.{id}', function ($user, $id) {
    if (!FakeRedis::exists("game:$id")) {
        return false;
    }

    return
        FakeRedis::hget("game:$id:player1", "id") == $user->id ||
        FakeRedis::hget("game:$id:player2", "id") == $user->id;
});
