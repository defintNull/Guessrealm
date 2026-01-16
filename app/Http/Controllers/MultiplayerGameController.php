<?php

namespace App\Http\Controllers;

use App\Events\LobbyEvent;
use App\Services\FakeRedis;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\Rule;

class MultiplayerGameController extends Controller
{
    /**
     * LOBBY STRUCTURE
     *
     * game:1
     *     id = 1
     *     aihelp = true
     *     timeout = 120
     *     game_state = 0
     * game:1:player1
     *     id = 123
     * game:1:player2
     *     id = 456
     * games = {1, 2, 3}
    */

    public function startGame(Request $request) : JsonResponse {
        $request->validate([
            'id' => ['required', 'integer', Rule::in(FakeRedis::smembers('lobbies'))],
        ]);

        $payload = [];
        Cache::lock("create_game", 10)->get(function() use($request, &$payload) {
            Cache::lock("lobby_$request->id", 5)->get(function() use($request, &$payload) {

                $ids = FakeRedis::smembers('games');

                $id = 0;
                while(in_array($id, $ids)) {
                    $id++;
                }

                $lobby = FakeRedis::hgetall("lobby:$request->id");
                // Creating Game
                FakeRedis::hset("game:$id", "id", $id);
                FakeRedis::hset("game:$id", "aihelp", $lobby['aihelp']);
                FakeRedis::hset("game:$id", "timeout", $lobby['timeout']);
                FakeRedis::hset("game:$id", "game_state", 0);
                FakeRedis::sadd("games", $id);

                // Creating players
                FakeRedis::hset("game:$id:player1", "id", FakeRedis::hget("lobby:$request->id:player1", 'id'));
                FakeRedis::hset("game:$id:player2", "id", FakeRedis::hget("lobby:$request->id:player1", 'id'));

                // Deleting lobby
                $keys = FakeRedis::keys("lobby:$request->id*");
                foreach ($keys as $key) {
                    FakeRedis::del($key);
                }
                FakeRedis::srem("lobbies", $request->id);

                $payload = [
                    'lobby_id' => $request->id,
                    'action' => 'START',
                    'aihelp' => $lobby['aihelp'],
                    'timeout' => $lobby['timeout'],
                    'game_websocket' => "game.$id"
                ];
                broadcast(new LobbyEvent($request->id, $payload))->toOthers();
            });
        });

        $filtered = array_intersect_key($payload, array_flip([
            'aihelp',
            'timeout',
            'game_websocket'
        ]));

        return response()->json([
            'status' => 200,
        ] + $filtered, 200);
    }
}
