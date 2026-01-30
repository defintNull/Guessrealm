<?php

use App\Models\Chat;
use App\Models\User;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Redis;


/**
 * Channel for lobbies
 */
Broadcast::channel('lobby.{id}', function ($user, $id) {
    if (!Redis::exists("lobby:$id")) {
        return false;
    }

    return
        Redis::hget("lobby:$id:player1", "id") == $user->id ||
        Redis::hget("lobby:$id:player2", "id") == $user->id;
});

/**
 * Game channels
 */
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

/**
 * Game chat channels
 */
Broadcast::channel('game.{id}.chat', function ($user, $id) {
    if (!Redis::exists("game:$id")) {
        return false;
    }

    return (
            Redis::hget("game:$id:player1", "id") == $user->id ||
            Redis::hget("game:$id:player2", "id") == $user->id
        );
});

/**
 * Chat channels
 */
Broadcast::channel('chat.{id}', function ($user, $id) {
    return $user->id == $id;
});

/**
 * Typing channels
 */
Broadcast::channel('chat.{chatId}.typing', function ($user, $chatId) {
    return Chat::find($chatId)
        ->users()
        ->where('users.id', $user->id)
        ->exists();
});

/**
 * Online state channel
 */
Broadcast::channel('chat_online', function (User $user) {
    return [
        'id' => $user->id
    ];
});
