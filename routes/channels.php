<?php

use App\Models\Chat;
use App\Models\User;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Redis;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('lobby.{id}', function ($user, $id) {
    if (!Redis::exists("lobby:$id")) {
        return false;
    }

    return
        Redis::hget("lobby:$id:player1", "id") == $user->id ||
        Redis::hget("lobby:$id:player2", "id") == $user->id;
});

Broadcast::channel('game.{id}.player.{player_id}', function ($user, $id, $player_id) {
    if (!Redis::exists("game:$id")) {
        return false;
    }

    return
        $user->id == $player_id &&
        (
            Redis::hget("game:$id:player1", "id") == $player_id ||
            Redis::hget("game:$id:player2", "id") == $player_id
        );
});

Broadcast::channel('game.{id}.chat', function ($user, $id) {
    if (!Redis::exists("game:$id")) {
        return false;
    }

    return (
            Redis::hget("game:$id:player1", "id") == $user->id ||
            Redis::hget("game:$id:player2", "id") == $user->id
        );
});


Broadcast::channel('chat.{id}', function ($user, $id) {
    return $user->id == $id;
});

Broadcast::channel('chat.{chatId}.typing', function ($user, $chatId) {
    return Chat::find($chatId)
        ->users()
        ->where('users.id', $user->id)
        ->exists();
});

Broadcast::channel('chat_online', function (User $user) {
    return [
        'id' => $user->id
    ];
});
