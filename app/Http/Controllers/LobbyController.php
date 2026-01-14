<?php

namespace App\Http\Controllers;

use App\Events\LobbyEvent;
use App\Models\User;
use App\Services\FakeRedis;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\Rule;

class LobbyController extends Controller
{
    /**
     * LOBBY STRUCTURE
     *
     * lobby:1
     *     id = 1
     *     time = 1700000000
     *     status = waiting
     * lobby:1:player1
     *     id = 123
     *     status = ready
     * lobby:1:player2
     *     id = 456
     *     status = waiting
     * lobbies = {1, 2, 3}
    */

    public function index() : JsonResponse
    {
        $lobbies = FakeRedis::smembers('lobbies');
        $result = [];

        foreach ($lobbies as $id) {
            if (!FakeRedis::exists("lobby:$id:player2")) {
                $player1Id = FakeRedis::hget("lobby:$id:player1", "id");
                if ($player1Id !== null) {
                    $player = User::where('id', $player1Id)->get();
                    if(!$player->isEmpty()) {
                        $result[] = [
                            'lobby_id' => (int)$id,
                            'player1' => $player[0]->only([
                                'id',
                                'username',
                                'profile_picture_path',
                                'profile_picture_mime'
                            ]),
                        ];
                    }
                }
            }
        }

        return response()->json([
            'status' => 200,
            'lobbies' => $result
        ]);
    }

    public function createLobby(Request $request) : JsonResponse {
        $id = 0;
        Cache::lock('lobby_create', 5)->get(function() use(&$id ,$request) {
            $ids = FakeRedis::smembers('lobbies');

            $id = 0;
            while(in_array($id, $ids)) {
                $id++;
            }

            // Creating lobby
            FakeRedis::hset("lobby:$id", "id", $id);
            FakeRedis::hset("lobby:$id", "time", time());
            FakeRedis::hset("lobby:$id", "status", false);
            FakeRedis::sadd("lobbies", $id);

            // Creating player1 user
            FakeRedis::hset("lobby:$id:player1", "id", $request->user()->id);
            FakeRedis::hset("lobby:$id:player1", "status", false);
        });

        return response()->json([
            'status' => 200,
            'lobby_id' => $id,
            'lobby_websocket' => "lobby.$id"
        ], 200);
    }

    public function deleteLobby(Request $request) : JsonResponse {
        $request->validate([
            'id' => ['required', 'integer', Rule::in(FakeRedis::smembers('lobbies'))]
        ]);

        Cache::lock("lobby_$request->id", 5)->get(function() use($request) {
            $keys = FakeRedis::keys("lobby:$request->id*");
            foreach ($keys as $key) {
                FakeRedis::del($key);
            }
            FakeRedis::srem("lobbies", $request->id);

            $payload = [
                'lobby_id' => $request->id,
                'action' => 'DELETE',
            ];
            broadcast(new LobbyEvent($request->id, $payload))->toOthers();
        });

        return response()->json([
            'status' => 200,
        ], 200);
    }

    public Function joinLobby(Request $request) {
        $request->validate([
            'id' => ['required', 'integer', Rule::in(FakeRedis::smembers('lobbies'))]
        ]);

        $status = true;
        Cache::lock("lobby_$request->id", 5)->get(function() use(&$status ,$request) {
            if(FakeRedis::exists("lobby:$request->id") && FakeRedis::exists("lobby:$request->id:player2")) {
                // Creating player2 user
                FakeRedis::hset("lobby:$request->id:player2", "id", $request->user()->id);
                FakeRedis::hset("lobby:$request->id:player2", "status", false);

                $payload = [
                    'lobby_id' => $request->id,
                    'action' => 'JOIN',
                    'user' => $request->user()->only([
                        'id',
                        'username',
                        'profile_picture_path',
                        'profile_picture_mime'
                    ])
                ];
                broadcast(new LobbyEvent($request->id, $payload))->toOthers();
            } else {
                $status = false;
            }
        });

        return response()->json([
            'status' => 200,
            'response' => $status,
        ], 200);
    }

    public function exitLobby(Request $request) : JsonResponse {
        $request->validate([
            'id' => ['required', 'integer', Rule::in(FakeRedis::smembers('lobbies'))]
        ]);

        Cache::lock("lobby_$request->id", 5)->get(function() use($request) {
            if(FakeRedis::exists("lobby:$request->id")) {
                FakeRedis::del("lobby:$request->id:player2");

                $payload = [
                    'lobby_id' => $request->id,
                    'action' => 'EXIT',
                    'user' => $request->user()->only([
                        'id',
                        'username',
                        'profile_picture_path',
                        'profile_picture_mime'
                    ])
                ];
                broadcast(new LobbyEvent($request->id, $payload))->toOthers();
            }
        });

        return response()->json([
            'status' => 200,
        ], 200);
    }

    public function setReady(Request $request) : JsonResponse {
        $request->validate([
            'id' => ['required', 'integer', Rule::in(FakeRedis::smembers('lobbies'))]
        ]);

        Cache::lock("lobby_$request->id", 5)->get(function() use($request) {
            if(FakeRedis::exists("lobby:$request->id")) {
                FakeRedis::hset("lobby:$request->id:player2", "status", true);

                $payload = [
                    'lobby_id' => $request->id,
                    'action' => 'READY',
                    'user' => $request->user()->only([
                        'id',
                        'username',
                        'profile_picture_path',
                        'profile_picture_mime'
                    ])
                ];
                broadcast(new LobbyEvent($request->id, $payload))->toOthers();
            }
        });

        return response()->json([
            'status' => 200,
        ], 200);
    }
}
