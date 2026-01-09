<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use \App\Models\User;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

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

    public function updateTheme(Request $request): JsonResponse
    {
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
    public function updatePassword(Request $request)
    {
        // 1. Controllo validazione
        $request->validate([
            'current_password' => ['required', 'string'],
            'new_password' => ['required', 'string', 'min:8', 'max:255'],
            'confirm_password' => ['required', 'same:new_password'],
        ]);

        $user = $request->user();

        // 2. Controllo vecchia password
        if (!Hash::check($request->current_password, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Password does not match our records.'],
            ]);
        }

        // 3. Aggiornamento
        $user->update([
            'password' => Hash::make($request->new_password),
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Password updated successfully'
        ], 200);
    }
}
