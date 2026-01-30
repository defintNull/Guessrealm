<?php

namespace App\Http\Controllers;

use App\Events\LobbyEvent;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Redis;
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

    /**
     * Return the first 20 available lobbies
     */
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'visibility' => ['in:0,1,2'],
            'name' => ['nullable', 'string'],
        ]);

        $lobbies = Redis::smembers('lobbies');
        $result = [];

        foreach ($lobbies as $id) {
            $data = Redis::hgetall("lobby:$id");

            $condition = !$request->has('visibility') ||
                        $request->visibility == 0 ||
                        $request->visibility - 1 == $data['visibility'];
            if (!empty($data) && !Redis::exists("lobby:$id:player2") && $condition && (!$request->has('name') || str_starts_with($data['name'], $request->name))) {
                $result[] = [
                    'id' => (int) $data['id'],
                    'name' => $data['name'],
                    'visibility' => (int) $data['visibility'],
                ];
            }
            if(count($result) == 20) {
                break;
            }
        }

        return response()->json([
            'status' => 200,
            'lobbies' => $result,
        ]);
    }

    /**
     * Show the detail of a given lobby
     */
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
            $isPlayer1 = Redis::hget("lobby:$lobbyId:player1", 'id') == $userId;
            $isPlayer2 = Redis::exists("lobby:$lobbyId:player2") && Redis::hget("lobby:$lobbyId:player2", 'id') == $userId;

            if (!Redis::exists("lobby:$lobbyId") || (!$isPlayer1 && !$isPlayer2)) {
                $status = false;
                return;
            }

            // Lobby
            $lobby = Redis::hgetall("lobby:$lobbyId");

            $res = [
                "id" => $lobby["id"],
                "name" => $lobby["name"],
                "code" => $lobby["code"],
                "visibility" => $lobby["visibility"],
                "players" => []
            ];

            // Player 1
            if (Redis::exists("lobby:$lobbyId:player1")) {
                $player = Redis::hgetall("lobby:$lobbyId:player1");
                $user = User::find($player["id"]);

                $res["players"][] = [
                    "id" => $player["id"],
                    "username" => $user->username,
                    "profile_picture_url" => $user->profile_picture_url,
                    "status" => $player["status"],
                ];
            }

            // Player 2
            if (Redis::exists("lobby:$lobbyId:player2")) {
                $player = Redis::hgetall("lobby:$lobbyId:player2");
                $user = User::find($player["id"]);

                $res["players"][] = [
                    "id" => $player["id"],
                    "username" => $user->username,
                    "profile_picture_url" => $user->profile_picture_url,
                    "status" => $player["status"],
                ];
            }
        });

        return response()->json([
            'status' => $status ? 200 : 400,
            'lobby' => $res,
        ]);
    }

    /**
     * Manage the lobby timeout event
     */
    public function timer(Request $request) : JsonResponse {
        $request->validate([
            'id' => ['required', 'integer', Rule::in(Redis::smembers('lobbies'))]
        ]);

        Cache::lock("lobby_$request->id", 5)->get(function() use($request) {
            if(Redis::exists("lobby:$request->id")) {
                $prefix = config('database.redis.options.prefix');
                $keys = Redis::keys("lobby:$request->id*");
                foreach ($keys as $key) {
                    $cleanKey = str_replace($prefix, '', $key);
                    Redis::del($cleanKey);
                }
                Redis::srem("lobbies", $request->id);
            }
        });

        return response()->json([
            'status' => 200,
        ], 200);
    }

    /**
     * Private function to generate a unique lobby name
     */
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

    /**
     * Manage the creation of a lobby entity
     */
    public function createLobby(Request $request) : JsonResponse {
        $request->validate([
            "lobby_visibility" => ['required' ,'integer', "in:0,1"],
            "ai_help" => ['required', 'boolean'],
            "timeout" => ['required', 'integer', "in:0.5,1,2,3,5"],
        ]);

        $id = 0;
        $code = Str::upper(Str::random(8));
        $name = $this->generateLobbyName();
        Cache::lock('lobby_create', 5)->get(function() use(&$id, $code, $name ,$request) {
            $ids = Redis::smembers('lobbies');

            $id = 0;
            while(in_array($id, $ids)) {
                $id++;
            }

            // Creating lobby
            Redis::hset("lobby:$id", "id", $id);
            Redis::hset("lobby:$id", "name", $name);
            Redis::hset("lobby:$id", "code", $code);
            Redis::hset("lobby:$id", "visibility", $request->lobby_visibility);
            Redis::hset("lobby:$id", "aihelp", $request->ai_help ? 1 : 0);
            Redis::hset("lobby:$id", "timeout", 60*$request->timeout);
            Redis::sadd("lobbies", $id);

            // Creating player1 user
            Redis::hset("lobby:$id:player1", "id", $request->user()->id);
            Redis::hset("lobby:$id:player1", "status", true);
        });

        return response()->json([
            'status' => 200,
            'lobby_id' => $id,
            'lobby_websocket' => "lobby.$id"
        ], 200);
    }

    /**
     * Manage the deletion of a lobby entity
     */
    public function deleteLobby(Request $request) : JsonResponse {
        $request->validate([
            'id' => ['required', 'integer', Rule::in(Redis::smembers('lobbies'))]
        ]);

        $status = true;
        Cache::lock("lobby_$request->id", 5)->get(function() use($request, &$status) {
            if(Redis::hget("lobby:$request->id:player1", "id") == $request->user()->id) {
                $prefix = config('database.redis.options.prefix');
                $keys = Redis::keys("lobby:$request->id*");
                foreach ($keys as $key) {
                    $cleanKey = str_replace($prefix, '', $key);
                    Redis::del($cleanKey);
                }
                Redis::srem("lobbies", $request->id);

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

    /**
     * Manage the join event in a given lobby
     */
    public Function joinLobby(Request $request) {
        $request->validate([
            'id' => ['required', 'integer', Rule::in(Redis::smembers('lobbies'))],
            'password' => ['nullable']
        ]);

        $status = true;
        Cache::lock("lobby_$request->id", 5)->get(function() use(&$status ,$request) {
            if(Redis::exists("lobby:$request->id") && !Redis::exists("lobby:$request->id:player2") && Redis::hget("lobby:$request->id:player1", "id") != $request->user()->id) {
                if(Redis::hget("lobby:$request->id", "visibility") == 1) {
                    if(!$request->has('password') || $request->password != Redis::hget("lobby:$request->id", "code")) {
                        $status = false;
                        return;
                    }
                }

                // Creating player2 user
                Redis::hset("lobby:$request->id:player2", "id", $request->user()->id);
                Redis::hset("lobby:$request->id:player2", "status", false);

                $payload = [
                    'lobby_id' => $request->id,
                    'action' => 'JOIN',
                    'user' => $request->user()->only([
                        'id',
                        'username',
                        'profile_picture_url'
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

    /**
     * Manage the exit event from a given lobby
     */
    public function exitLobby(Request $request) : JsonResponse {
        $request->validate([
            'id' => ['required', 'integer', Rule::in(Redis::smembers('lobbies'))]
        ]);

        Cache::lock("lobby_$request->id", 5)->get(function() use($request) {
            if(Redis::exists("lobby:$request->id") && Redis::hget("lobby:$request->id:player2", "id") == $request->user()->id) {
                Redis::del("lobby:$request->id:player2");

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

    /**
     * Set the ready state for the player2 user
     */
    public function setReady(Request $request) : JsonResponse {
        $request->validate([
            'id' => ['required', 'integer', Rule::in(Redis::smembers('lobbies'))],
            'ready' => ['required', 'boolean'],
        ]);

        Cache::lock("lobby_$request->id", 5)->get(function() use($request) {
            if(Redis::exists("lobby:$request->id") && Redis::hget("lobby:$request->id:player2", "id") == $request->user()->id) {
                Redis::hset("lobby:$request->id:player2", "status", $request->ready);

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
