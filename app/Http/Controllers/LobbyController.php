<?php

namespace App\Http\Controllers;

use App\Events\LobbyEvent;
use App\Models\User;
use App\Services\FakeRedis;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class LobbyController extends Controller
{
    /**
     * LOBBY STRUCTURE
     *
     * lobby:1
     *     id = 1
     *     name: "prova"
     *     code: 21321564
     *     visibility: 0
     *     aihelp = true
     *     timeout = 120
     * lobby:1:player1
     *     id = 123
     *     status = true
     * lobby:1:player2
     *     id = 456
     *     status = false
     * lobbies = {1, 2, 3}
    */

    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'visibility' => ['in:0,1,2'],
            'name' => ['nullable', 'string'],
        ]);

        $lobbies = FakeRedis::smembers('lobbies');
        $result = [];

        foreach ($lobbies as $id) {
            $data = FakeRedis::hgetall("lobby:$id");

            $condition = !$request->has('visibility') ||
                        $request->visibility == 0 ||
                        $request->visibility - 1 == $data['visibility'];
            if (!empty($data) && !FakeRedis::exists("lobby:$id:player2") && $condition && (!$request->has('name') || str_starts_with($data['name'], $request->name))) {
                $result[] = [
                    'id' => (int) $data['id'],
                    'name' => $data['name'],
                    'visibility' => (int) $data['visibility'],
                ];
            }
        }

        return response()->json([
            'status' => 200,
            'lobbies' => $result,
        ]);
    }

    public function show(Request $request) : JsonResponse {
        $request->validate([
            'id' => ['required', 'integer']
        ]);

        $status = true;
        $res = [];

        Cache::lock("lobby_{$request->id}", 5)->get(function() use (&$status, &$res, $request) {

            $lobbyId = $request->id;
            $userId = $request->user()->id;

            // Controllo accesso
            $isPlayer1 = FakeRedis::hget("lobby:$lobbyId:player1", 'id') == $userId;
            $isPlayer2 = FakeRedis::exists("lobby:$lobbyId:player2") && FakeRedis::hget("lobby:$lobbyId:player2", 'id') == $userId;

            if (!FakeRedis::exists("lobby:$lobbyId") || (!$isPlayer1 && !$isPlayer2)) {
                $status = false;
                return;
            }

            // Lobby
            $lobby = FakeRedis::hgetall("lobby:$lobbyId");

            $res = [
                "id" => $lobby["id"],
                "name" => $lobby["name"],
                "code" => $lobby["code"],
                "visibility" => $lobby["visibility"],
                "players" => []
            ];

            // Player 1
            if (FakeRedis::exists("lobby:$lobbyId:player1")) {
                $player = FakeRedis::hgetall("lobby:$lobbyId:player1");
                $user = User::find($player["id"]);

                $res["players"][] = [
                    "id" => $player["id"],
                    "username" => $user->username,
                    "profile_picture_path" => $user->profile_picture_path,
                    "profile_picture_mime" => $user->profile_picture_mime,
                    "status" => $player["status"],
                ];
            }

            // Player 2
            if (FakeRedis::exists("lobby:$lobbyId:player2")) {
                $player = FakeRedis::hgetall("lobby:$lobbyId:player2");
                $user = User::find($player["id"]);

                $res["players"][] = [
                    "id" => $player["id"],
                    "username" => $user->username,
                    "profile_picture_path" => $user->profile_picture_path,
                    "profile_picture_mime" => $user->profile_picture_mime,
                    "status" => $player["status"],
                ];
            }
        });

        return response()->json([
            'status' => $status ? 200 : 400,
            'lobby' => $res,
        ]);
    }

    public function timer(Request $request) : JsonResponse {
        $request->validate([
            'id' => ['required', 'integer', Rule::in(FakeRedis::smembers('lobbies'))]
        ]);

        Cache::lock("lobby_$request->id", 5)->get(function() use($request) {
            if(FakeRedis::exists("lobby:$request->id")) {
                $keys = FakeRedis::keys("lobby:$request->id*");
                foreach ($keys as $key) {
                    FakeRedis::del($key);
                }
                FakeRedis::srem("lobbies", $request->id);
            }
        });

        return response()->json([
            'status' => 200,
        ], 200);
    }

    private function generateLobbyName(): string
    {
        $adjectives = ['sleepy', 'stoic', 'eager', 'brave', 'frosty', 'serene', 'bold', 'mystic', 'clever', 'happy'];
        $names = ['turing', 'morse', 'curie', 'babbage', 'lovelace', 'hopper', 'einstein', 'tesla', 'newton', 'fermi'];

        return $adjectives[array_rand($adjectives)]
            . '_' .
            $names[array_rand($names)]
            . '_' .
            Str::lower(Str::random(5));
    }


    public function createLobby(Request $request) : JsonResponse {
        $request->validate([
            "lobby_visibility" => ['integer', "in:0,1"],
            "ai_help" => ['integer', "in:0,1"],
            "timeout" => ['integer', "in:0.5,1,2,3,5"],
        ]);

        $id = 0;
        $code = Str::upper(Str::random(8));
        $name = $this->generateLobbyName();
        Cache::lock('lobby_create', 5)->get(function() use(&$id, $code, $name ,$request) {
            $ids = FakeRedis::smembers('lobbies');

            $id = 0;
            while(in_array($id, $ids)) {
                $id++;
            }

            // Creating lobby
            FakeRedis::hset("lobby:$id", "id", $id);
            FakeRedis::hset("lobby:$id", "name", $name);
            FakeRedis::hset("lobby:$id", "code", $code);
            FakeRedis::hset("lobby:$id", "visibility", $request->lobby_visibility);
            FakeRedis::hset("lobby:$id", "aihelp", $request->ai_help);
            FakeRedis::hset("lobby:$id", "timeout", 60*$request->timeout);
            FakeRedis::sadd("lobbies", $id);

            // Creating player1 user
            FakeRedis::hset("lobby:$id:player1", "id", $request->user()->id);
            FakeRedis::hset("lobby:$id:player1", "status", true);
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

        $status = true;
        Cache::lock("lobby_$request->id", 5)->get(function() use($request, &$status) {
            if(FakeRedis::hget("lobby:$request->id:player1", "id") == $request->user()->id) {
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
            } else {
                $status = false;
            }
        });

        return response()->json([
            'status' => $status ? 200 : 400,
        ], 200);
    }

    public Function joinLobby(Request $request) {
        $request->validate([
            'id' => ['required', 'integer', Rule::in(FakeRedis::smembers('lobbies'))],
            'password' => ['nullable']
        ]);

        $status = true;
        Cache::lock("lobby_$request->id", 5)->get(function() use(&$status ,$request) {
            if(FakeRedis::exists("lobby:$request->id") && !FakeRedis::exists("lobby:$request->id:player2") && FakeRedis::hget("lobby:$request->id:player1", "id") != $request->user()->id) {
                if(FakeRedis::hget("lobby:$request->id", "visibility") == 1) {
                    if(!$request->has('password') || $request->password != FakeRedis::hget("lobby:$request->id", "code")) {
                        $status = false;
                        return;
                    }
                }

                // Creating player2 user
                FakeRedis::hset("lobby:$request->id:player2", "id", $request->user()->id);
                FakeRedis::hset("lobby:$request->id:player2", "status", false);

                $payload = [
                    'lobby_id' => $request->id,
                    'action' => 'JOIN',
                    'user' => $request->user()->only([
                        'id',
                        'username'
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
            'lobby_id' => $request->id,
            'lobby_websocket' => "lobby.$request->id"
        ], 200);
    }

    public function exitLobby(Request $request) : JsonResponse {
        $request->validate([
            'id' => ['required', 'integer', Rule::in(FakeRedis::smembers('lobbies'))]
        ]);

        Cache::lock("lobby_$request->id", 5)->get(function() use($request) {
            if(FakeRedis::exists("lobby:$request->id") && FakeRedis::hget("lobby:$request->id:player2", "id") == $request->user()->id) {
                FakeRedis::del("lobby:$request->id:player2");

                $payload = [
                    'lobby_id' => $request->id,
                    'action' => 'EXIT',
                    'user' => $request->user()->only([
                        'id',
                        'username'
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
            'id' => ['required', 'integer', Rule::in(FakeRedis::smembers('lobbies'))],
            'ready' => ['required', 'boolean'],
        ]);

        Cache::lock("lobby_$request->id", 5)->get(function() use($request) {
            if(FakeRedis::exists("lobby:$request->id") && FakeRedis::hget("lobby:$request->id:player2", "id") == $request->user()->id) {
                FakeRedis::hset("lobby:$request->id:player2", "status", $request->ready);

                $payload = [
                    'lobby_id' => $request->id,
                    'action' => 'READY',
                    'user' => $request->user()->only([
                        'id',
                        'username'
                    ]),
                    'ready' => $request->ready,

                ];
                broadcast(new LobbyEvent($request->id, $payload))->toOthers();
            }
        });

        return response()->json([
            'status' => 200,
            'user' => $request->user()->only([
                'id',
                'username'
            ])
        ], 200);
    }
}
