<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use \App\Models\User;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\JsonResponse;

class ProfileController extends Controller
{

    public function update(Request $request)
    {
        $user = $request->user();

        $validatedData = $request->validate([
            'name' => 'required|string|max:255',
            'surname' => 'required|string|max:255',
            'username' => 'required|string|max:255|unique:users,username,' . $user->id,
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'theme' => 'nullable|string|in:system,light,dark',
        ]);

        $user->update($validatedData);

        return response()->json(['message' => 'Profile updated successfully', 'user' => $user->only(['id', 'name', 'surname', 'username', 'email'])]);
    }

    public function checkEditUsername(String $username)
    {
        $user = Auth::user();

        $exists = User::where('username', $username)
            ->where('id', '!=', $user->id)
            ->exists();

        return response()->json(['exists' => $exists]);
    }

    public function checkEditEmail(String $email)
    {
        $user = Auth::user();

        $exists = User::where('email', $email)
            ->where('id', '!=', $user->id)
            ->exists();

        return response()->json(['exists' => $exists]);
    }

    public function updateTheme(Request $request) : JsonResponse {
        // 1. Validazione: Accettiamo solo i tre valori permessi
        $request->validate([
            'theme' => ['required', 'string', 'in:system,light,dark']
        ]);

        /** @var \App\Models\User $user */
        $user = Auth::user();

        // 2. Aggiornamento del dato
        $user->update([
            'theme' => $request->theme
        ]);

        // 3. Risposta
        return response()->json([
            'status' => 'OK',
            'message' => 'Theme updated successfully',
            'theme' => $user->theme
        ], 200);
    }
}
