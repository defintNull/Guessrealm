<?php

namespace App\Http\Controllers;

use App\Events\GameEvent;
use App\Events\LobbyEvent;
use App\Models\Photo;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class MultiplayerGameController extends Controller
{
    /**
     * LOBBY STRUCTURE
     *
     * game:1
     *     id = 1
     *     aihelp = 0
     *     timeout = 120
     *     game_state = 0
     *     photos = {{id, name}, {id, name}}
     * game:1:player1
     *     id = 123,
     *     loading = 0
     *     character = 0
     *     guess_character = 0
     * game:1:player2
     *     id = 456
     *     loading = 0
     *     character = 0
     *     guess_character = 0
     * games = {1, 2, 3}
    */

    public function startGame(Request $request) : JsonResponse {
        $request->validate([
            'id' => ['required', 'integer', Rule::in(Redis::smembers('lobbies'))],
        ]);

        $payload = [];
        Cache::lock("create_game", 10)->get(function() use($request, &$payload) {
            Cache::lock("lobby_$request->id", 5)->get(function() use($request, &$payload) {

                $ids = Redis::smembers('games');

                $id = 0;
                while(in_array($id, $ids)) {
                    $id++;
                }

                $lobby = Redis::hgetall("lobby:$request->id");
                // Creating Game
                Redis::hset("game:$id", "id", $id);
                Redis::hset("game:$id", "aihelp", $lobby['aihelp']);
                Redis::hset("game:$id", "timeout", $lobby['timeout']);
                Redis::hset("game:$id", "game_state", 0);
                Redis::hset("game:$id", "photos", 0);
                Redis::sadd("games", $id);

                // Creating players
                Redis::hset("game:$id:player1", "id", Redis::hget("lobby:$request->id:player1", 'id'));
                Redis::hset("game:$id:player1", "loading", 1);
                Redis::hset("game:$id:player1", "character", 0);
                Redis::hset("game:$id:player1", "guess_character", 0);
                Redis::hset("game:$id:player2", "id", Redis::hget("lobby:$request->id:player2", 'id'));
                Redis::hset("game:$id:player2", "loading", 1);
                Redis::hset("game:$id:player2", "character", 0);
                Redis::hset("game:$id:player2", "guess_character", 0);

                // Deleting lobby
                $keys = Redis::keys("lobby:$request->id*");
                foreach ($keys as $key) {
                    Redis::del($key);
                }
                Redis::srem("lobbies", $request->id);

                $player1_id = Redis::hget("game:$id:player1", "id");
                $player2_id = Redis::hget("game:$id:player2", "id");
                $guest_id = $player1_id == $request->user()->id ? $player2_id : $player1_id;
                $payload = [
                    'lobby_id' => $request->id,
                    'action' => 'START',
                    'aihelp' => $lobby['aihelp'] == 1,
                    'timeout' => $lobby['timeout'],
                    'game_id' => $id,
                    'game_websocket' => "game.$id.player.".$guest_id,
                    'chat_websocket' => "game.$id.chat",
                    'enemy' => $request->user()->only([
                        'id',
                        'username',
                        'profile_picture_path'
                    ])
                ];
                Redis::hset("game:$id", "game_state", 1);
                broadcast(new LobbyEvent($request->id, $payload))->toOthers();
            });
        });

        $filtered = array_intersect_key($payload, array_flip([
            'aihelp',
            'timeout',
            'game_id',
            'chat_websocket',
        ]));

        return response()->json([
            'status' => 200,
            'game_websocket' => "game.".$filtered['game_id'].".player.".$request->user()->id,
            'enemy' => User::find(Redis::hget("game:".$filtered['game_id'].":player2", "id"))->only([
                        'id',
                        'username',
                        'profile_picture_path'
                    ])
        ] + $filtered, 200);
    }

    public function getPhotos(Request $request) : JsonResponse {
        $request->validate([
            'id' => ['required', 'integer', Rule::in(Redis::smembers('games'))],
        ]);

        $fotos = [];
        Cache::lock("game_$request->id", 5)->get(function() use($request, &$fotos) {
            if(Redis::exists("game:$request->id") && Redis::hget("game:$request->id", "photos") == 0) {
                $photos = Photo::select(['id', 'name'])->inRandomOrder()->limit(24)->get();
                Redis::hset("game:$request->id", "photos", $photos->toJson());
                $fotos = $photos;
            } else if(Redis::exists("game:$request->id")) {
                $fotos = json_decode(Redis::hget("game:$request->id", "photos"));
            }
        });


        return response()->json([
            'photos' => $fotos,
        ], 200);
    }

    public function endLoading(Request $request) : JsonResponse {
        $request->validate([
            'id' => ['required', 'integer', Rule::in(Redis::smembers('games'))],
        ]);

        Cache::lock("game_$request->id", 5)->get(function() use($request) {
            if(Redis::hget("game:$request->id", "game_state") == 1) {
                if(Redis::exists("game:$request->id:player1") && Redis::exists("game:$request->id:player2")) {
                    if(Redis::hget("game:$request->id:player1", "id") == $request->user()->id) {
                        Redis::hset("game:$request->id:player1", "loading", 0);
                    } elseif(Redis::hget("game:$request->id:player2", "id") == $request->user()->id) {
                        Redis::hset("game:$request->id:player2", "loading", 0);
                    }
                } else {
                    return;
                }

                if(Redis::hget("game:$request->id:player1", "loading") == 0 &&
                    Redis::hget("game:$request->id:player2", "loading") == 0
                ){
                    Redis::hset("game:$request->id", "game_state", 2);
                    broadcast(new GameEvent($request->id, Redis::hget("game:$request->id:player1", "id"), 2, []));
                    broadcast(new GameEvent($request->id, Redis::hget("game:$request->id:player2", "id"), 2, []));
                }
            }
        });

        return response()->json();
    }

    public function chooseCharacter(Request $request) : JsonResponse {
        $request->validate([
            'id' => ['required', 'integer', Rule::in(Redis::smembers('games'))],
            'character' => ['required', 'integer']
        ]);

        Cache::lock("game_$request->id", 5)->get(function() use($request) {
            if(Redis::hget("game:$request->id", "game_state") == 2) {
                if(Redis::exists("game:$request->id:player1") && Redis::exists("game:$request->id:player2")) {
                    if(Redis::hget("game:$request->id:player1", "id") == $request->user()->id) {
                        Redis::hset("game:$request->id:player1", "character", $request->character);
                    } elseif(Redis::hget("game:$request->id:player2", "id") == $request->user()->id) {
                        Redis::hset("game:$request->id:player2", "character", $request->character);
                    }
                } else {
                    return;
                }

                if(Redis::hget("game:$request->id:player1", "character") != 0 &&
                    Redis::hget("game:$request->id:player2", "character") != 0
                ){
                    Redis::hset("game:$request->id", "game_state", 3);

                    broadcast(new GameEvent($request->id, Redis::hget("game:$request->id:player1", "id"), 3, []));
                    broadcast(new GameEvent($request->id, Redis::hget("game:$request->id:player2", "id"), 6, []));
                }
            }
        });

        return response()->json();
    }

    public function chooseQuestion(Request $request) : JsonResponse {
        $request->validate([
            'id' => ['required', 'integer', Rule::in(Redis::smembers('games'))],
            'question' => ['required', 'integer']
        ]);

        Cache::lock("game_$request->id", 5)->get(function() use($request) {
            $game_state = Redis::hget("game:$request->id", "game_state");
            if(Redis::exists("game:$request->id:player1") &&
                Redis::exists("game:$request->id:player2")
            ){
                if($game_state == 3 && $request->user()->id == Redis::hget("game:$request->id:player1", 'id')) {
                    Redis::hset("game:$request->id", "game_state", 4);

                    broadcast(new GameEvent($request->id, Redis::hget("game:$request->id:player1", "id"), 4, []));
                    broadcast(new GameEvent($request->id, Redis::hget("game:$request->id:player2", "id"), 7, [
                        'question' => $request->question
                    ]));
                } elseif($game_state == 6 && $request->user()->id == Redis::hget("game:$request->id:player2", 'id')) {
                    Redis::hset("game:$request->id", "game_state", 7);

                    broadcast(new GameEvent($request->id, Redis::hget("game:$request->id:player1", "id"), 7, [
                        'question' => $request->question
                    ]));
                    broadcast(new GameEvent($request->id, Redis::hget("game:$request->id:player2", "id"), 4, []));
                }
            }
        });

        return response()->json();
    }

    public function response(Request $request) : JsonResponse {
        $request->validate([
            'id' => ['required', 'integer', Rule::in(Redis::smembers('games'))],
            'response' => ['required', 'boolean']
        ]);

        Cache::lock("game_$request->id", 5)->get(function() use($request) {
            $game_state = Redis::hget("game:$request->id", "game_state");
            if(Redis::exists("game:$request->id:player1") &&
                Redis::exists("game:$request->id:player2")
            ){
                if($game_state == 4 && $request->user()->id == Redis::hget("game:$request->id:player2", 'id')) {
                    Redis::hset("game:$request->id", "game_state", 5);

                    broadcast(new GameEvent($request->id, Redis::hget("game:$request->id:player1", "id"), 5, [
                        'response' => $request->response
                    ]));
                    broadcast(new GameEvent($request->id, Redis::hget("game:$request->id:player2", "id"), 8, []));
                } elseif($game_state == 7 && $request->user()->id == Redis::hget("game:$request->id:player1", 'id')) {
                    Redis::hset("game:$request->id", "game_state", 8);

                    broadcast(new GameEvent($request->id, Redis::hget("game:$request->id:player1", "id"), 8, []));
                    broadcast(new GameEvent($request->id, Redis::hget("game:$request->id:player2", "id"), 5, [
                        'response' => $request->response
                    ]));
                }
            }
        });

        return response()->json();
    }

    public function endClosure(Request $request) : JsonResponse {
        $request->validate([
            'id' => ['required', 'integer', Rule::in(Redis::smembers('games'))],
            'remaining' => ['required', 'integer']
        ]);

        Cache::lock("game_$request->id", 5)->get(function() use($request) {
            $game_state = Redis::hget("game:$request->id", "game_state");
            if(Redis::exists("game:$request->id:player1") &&
                Redis::exists("game:$request->id:player2")
            ){
                if($game_state == 5 && $request->user()->id == Redis::hget("game:$request->id:player1", 'id')) {
                    Redis::hset("game:$request->id", "game_state", 6);

                    broadcast(new GameEvent($request->id, Redis::hget("game:$request->id:player1", "id"), 6, []));
                    broadcast(new GameEvent($request->id, Redis::hget("game:$request->id:player2", "id"), 3, [
                        'remaining' => $request->remaining
                    ]));
                } elseif($game_state == 8 && $request->user()->id == Redis::hget("game:$request->id:player2", 'id')) {
                    Redis::hset("game:$request->id", "game_state", 3);

                    broadcast(new GameEvent($request->id, Redis::hget("game:$request->id:player1", "id"), 3, [
                        'remaining' => $request->remaining
                    ]));
                    broadcast(new GameEvent($request->id, Redis::hget("game:$request->id:player2", "id"), 6, []));
                }
            }
        });

        return response()->json();
    }

    public function skip(Request $request) : JsonResponse {
        $request->validate([
            'id' => ['required', 'integer', Rule::in(Redis::smembers('games'))],
        ]);

        Cache::lock("game_$request->id", 5)->get(function() use($request) {
            $game_state = Redis::hget("game:$request->id", "game_state");
            if(Redis::exists("game:$request->id:player1") &&
                Redis::exists("game:$request->id:player2")
            ){
                if($game_state == 3 && $request->user()->id == Redis::hget("game:$request->id:player1", 'id')) {
                    Redis::hset("game:$request->id", "game_state", 6);

                    broadcast(new GameEvent($request->id, Redis::hget("game:$request->id:player1", "id"), 6, []));
                    broadcast(new GameEvent($request->id, Redis::hget("game:$request->id:player2", "id"), 3, []));
                } elseif($game_state == 6 && $request->user()->id == Redis::hget("game:$request->id:player2", 'id')) {
                    Redis::hset("game:$request->id", "game_state", 3);

                    broadcast(new GameEvent($request->id, Redis::hget("game:$request->id:player1", "id"), 3, []));
                    broadcast(new GameEvent($request->id, Redis::hget("game:$request->id:player2", "id"), 6, []));
                }
            }
        });

        return response()->json();
    }

    public function guess(Request $request) : JsonResponse {
        $request->validate([
            'id' => ['required', 'integer', Rule::in(Redis::smembers('games'))],
        ]);

        Cache::lock("game_$request->id", 5)->get(function() use($request) {
            $game_state = Redis::hget("game:$request->id", "game_state");
            if(Redis::exists("game:$request->id:player1") &&
                Redis::exists("game:$request->id:player2")
            ){
                if($game_state == 3 && $request->user()->id == Redis::hget("game:$request->id:player1", 'id')) {
                    Redis::hset("game:$request->id", "game_state", 9);

                    broadcast(new GameEvent($request->id, Redis::hget("game:$request->id:player1", "id"), 9, []));
                    broadcast(new GameEvent($request->id, Redis::hget("game:$request->id:player2", "id"), 11, []));
                } elseif($game_state == 6 && $request->user()->id == Redis::hget("game:$request->id:player2", 'id')) {
                    Redis::hset("game:$request->id", "game_state", 11);

                    broadcast(new GameEvent($request->id, Redis::hget("game:$request->id:player1", "id"), 11, []));
                    broadcast(new GameEvent($request->id, Redis::hget("game:$request->id:player2", "id"), 9, []));
                }
            }
        });

        return response()->json();
    }

    public function guessCharacter(Request $request) : JsonResponse {
        $request->validate([
            'id' => ['required', 'integer', Rule::in(Redis::smembers('games'))],
            'character' => ['required', 'integer'],
        ]);

        Cache::lock("game_$request->id", 5)->get(function() use($request) {
            $game_state = Redis::hget("game:$request->id", "game_state");
            if(Redis::exists("game:$request->id:player1") &&
                Redis::exists("game:$request->id:player2")
            ){
                if($game_state == 9 && $request->user()->id == Redis::hget("game:$request->id:player1", 'id')) {
                    Redis::hset("game:$request->id", "game_state", 10);
                    Redis::hset("game:$request->id:player1", "guess_character", $request->character);

                    broadcast(new GameEvent($request->id, Redis::hget("game:$request->id:player1", "id"), 10, []));
                    broadcast(new GameEvent($request->id, Redis::hget("game:$request->id:player2", "id"), 12, [
                        'character' => $request->character
                    ]));
                } elseif($game_state == 11 && $request->user()->id == Redis::hget("game:$request->id:player2", 'id')) {
                    Redis::hset("game:$request->id", "game_state", 12);
                    Redis::hset("game:$request->id:player2", "guess_character", $request->character);

                    broadcast(new GameEvent($request->id, Redis::hget("game:$request->id:player1", "id"), 12, [
                        'character' => $request->character
                    ]));
                    broadcast(new GameEvent($request->id, Redis::hget("game:$request->id:player2", "id"), 10, []));
                }
            }
        });

        return response()->json();
    }

    public function guessResponse(Request $request) : JsonResponse {
        $request->validate([
            'id' => ['required', 'integer', Rule::in(Redis::smembers('games'))],
            'response' => ['required', 'boolean'],
        ]);

        Cache::lock("game_$request->id", 5)->get(function() use($request) {
            $game_state = Redis::hget("game:$request->id", "game_state");
            if(Redis::exists("game:$request->id:player1") &&
                Redis::exists("game:$request->id:player2")
            ){
                if($game_state == 10 && $request->user()->id == Redis::hget("game:$request->id:player2", 'id')) {
                    Redis::hset("game:$request->id", "game_state", 13);

                    $result = Redis::hget("game:$request->id:player1", "guess_character") == Redis::hget("game:$request->id:player2", "character");

                    $player1_id = Redis::hget("game:$request->id:player1", "id");
                    broadcast(new GameEvent($request->id, $player1_id, 13, [
                        'end' => $result,
                    ]));
                    StatisticsController::update($player1_id, $result);

                    $player2_id = Redis::hget("game:$request->id:player2", "id");
                    broadcast(new GameEvent($request->id, $player2_id, 13, [
                        'end' => !$result
                    ]));
                    StatisticsController::update($player2_id, !$result);
                } elseif($game_state == 12 && $request->user()->id == Redis::hget("game:$request->id:player1", 'id')) {
                    Redis::hset("game:$request->id", "game_state", 13);

                    $result = Redis::hget("game:$request->id:player2", "guess_character") == Redis::hget("game:$request->id:player1", "character");

                    $player1_id = Redis::hget("game:$request->id:player1", "id");
                    broadcast(new GameEvent($request->id, $player1_id, 13, [
                        'end' => !$result,
                    ]));
                    StatisticsController::update($player1_id, !$result);

                    $player2_id = Redis::hget("game:$request->id:player2", "id");
                    broadcast(new GameEvent($request->id, $player2_id, 13, [
                        'end' => $result
                    ]));
                    StatisticsController::update($player2_id, $result);
                }

                $keys = Redis::keys("game:$request->id*");
                foreach ($keys as $key) {
                    Redis::del($key);
                }
                Redis::srem("games", $request->id);
            }
        });

        return response()->json();
    }

    public function endTimer(Request $request) : JsonResponse {
        $request->validate([
            'id' => ['required', 'integer', Rule::in(Redis::smembers('games'))],
        ]);

        Cache::lock("game_$request->id", 5)->get(function() use($request) {
            $game_state = Redis::hget("game:$request->id", "game_state");
            if(Redis::exists("game:$request->id:player1") &&
                Redis::exists("game:$request->id:player2")
            ){
                if(in_array($game_state, [7, 9, 12]) || ($game_state == 2 && Redis::hget("game:$request->id:player1", "character") == 0)) {
                    Redis::hset("game:$request->id", "game_state", 13);

                    $player1_id = Redis::hget("game:$request->id:player1", "id");
                    broadcast(new GameEvent($request->id, $player1_id, 13, [
                        'end' => false,
                    ]));
                    StatisticsController::update($player1_id, false);

                    $player2_id = Redis::hget("game:$request->id:player2", "id");
                    broadcast(new GameEvent($request->id, $player2_id, 13, [
                        'end' => true,
                    ]));
                    StatisticsController::update($player2_id, true);
                } elseif(in_array($game_state, [4, 10, 11]) || ($game_state == 2 && Redis::hget("game:$request->id:player2", "character") == 0)) {
                    Redis::hset("game:$request->id", "game_state", 13);

                    $player1_id = Redis::hget("game:$request->id:player1", "id");
                    broadcast(new GameEvent($request->id, $player1_id, 13, [
                        'end' => true,
                    ]));
                    StatisticsController::update($player1_id, true);

                    $player2_id = Redis::hget("game:$request->id:player2", "id");
                    broadcast(new GameEvent($request->id, $player2_id, 13, [
                        'end' => false,
                    ]));
                    StatisticsController::update($player2_id, false);
                }
            }
        });

        return response()->json();
    }

    public function exit(Request $request) : JsonResponse {
        if (empty($request->all())) {
            $raw = $request->getContent();
            $decoded = json_decode($raw, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $request->merge($decoded);
            }
        }

        $request->validate([
            'type' => ['required', 'string', 'in:lobby,game'],
            'id' => ['required', 'integer']
        ]);

        if($request->type == "lobby") {
            Cache::lock("lobby_$request->id", 5)->get(function() use($request) {
                if(Redis::exists("lobby:$request->id")) {
                    $payload = [
                        'lobby_id' => $request->id,
                        'action' => 'DELETE',
                    ];
                    broadcast(new LobbyEvent($request->id, $payload))->toOthers();

                    $keys = Redis::keys("lobby:$request->id*");
                    foreach ($keys as $key) {
                        Redis::del($key);
                    }
                    Redis::srem("lobbies", $request->id);
                }
            });
        } else {
            Cache::lock("game_$request->id", 5)->get(function() use($request) {
                if(Redis::exists("game:$request->id")) {
                    Redis::hset("game:$request->id", "game_state", 13);

                    $result = Redis::hget("game:$request->id:player1", "id") == $request->user()->id;

                    $player1_id = Redis::hget("game:$request->id:player1", "id");
                    broadcast(new GameEvent($request->id, $player1_id, 13, [
                        'end' => !$result,
                    ]));
                    !$result ? StatisticsController::update($player1_id, !$result) : null;

                    $player2_id = Redis::hget("game:$request->id:player2", "id");
                    broadcast(new GameEvent($request->id, $player2_id, 13, [
                        'end' => $result
                    ]));
                    $result ? StatisticsController::update($player2_id, $result) : null;

                    $keys = Redis::keys("game:$request->id*");
                    foreach ($keys as $key) {
                        Redis::del($key);
                    }
                    Redis::srem("games", $request->id);
                }
            });
        }

        return response()->json();
    }

    public function getBgMusic() {
        return response()->file(
                Storage::disk('local')->path('Audios/bgmusic.mp3')
            );
    }
}
