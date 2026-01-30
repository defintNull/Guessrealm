<?php

namespace App\Http\Controllers;

use App\Models\Statistic;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StatisticsController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index() :JsonResponse
    {
        $leaderboardStats = Statistic::with('user:id,username,profile_picture_path,updated_at')
            ->orderByDesc('level')
            ->orderByDesc('xp')
            ->take(10)
            ->get();

        $leaderboard = $leaderboardStats->map(function ($stat) {
            $user = $stat->user;
            return [
                'username' => $user->username,
                'profile_picture_url' => $user->profile_picture_url,
                'level' => $stat->level,
            ];
        });

        $leaderboardStatsWin = Statistic::with('user:id,username,profile_picture_path,updated_at')
            ->orderByDesc('wins')
            ->orderByDesc('level')
            ->take(10)
            ->get();

        $leaderboardWin = $leaderboardStatsWin->map(function ($stat) {
            $user = $stat->user;
            return [
                'username' => $user->username,
                'profile_picture_url' => $user->profile_picture_url,
                'wins' => $stat->wins,
            ];
        });

        return response()->json([
            'leaderboard' => $leaderboard,
            'leaderboard_win' => $leaderboardWin
        ], 200);
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request) : JsonResponse
    {
        $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id']
        ]);

        $statistic = User::find($request->user_id)->statistic;

        return response()->json([
            'statistic' => $statistic->only([
                'games',
                'wins',
                'loses',
                'level',
                'xp'
            ])
        ], 200);
    }

    /**
     * Update a statistic entity given a user and the result of a game
     */
    public static function update(string $user_id, bool $result) : void {
        $player = User::find($user_id);
        if ($player && $player->statistic) {
            $player->statistic->games += 1;
            if($result) {
                $player->statistic->wins += 1;
                $player->statistic->xp += 13;
            } else {
                $player->statistic->loses += 1;
                $player->statistic->xp += 3;
            }
            if($player->statistic->xp >= 100) {
                $player->statistic->level += 1;
                $player->statistic->xp -= 100;
            }
            $player->statistic->save();
        }
    }
}
