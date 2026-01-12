<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules\Password;
use Symfony\Component\HttpFoundation\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'username' => ['required', 'string', 'max:255'],
            'password' => ['required', 'string', 'max:255', 'min:8']
        ]);

        if (Auth::attempt([
            'username' => $request->username,
            'password' => $request->password,
        ])) {
            $request->session()->regenerate();
            /** @var \App\Models\User $user */
            $user = Auth::user();
            return response()->json([
                'status' => 'OK',
                'user' => $user->only([
                    'id',
                    'name',
                    'surname',
                    'username',
                    'email',
                    'theme',
                    'profile_picture_url',
                ]),
            ], 200);
        }

        return response()->json([
            'errors' => 'Wrong credentials!'
        ], 401);
    }

    public function register(Request $request): JsonResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'surname' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email', 'max:255'],
            'username' => ['required', 'string', 'unique:users,username', 'max:255'],
            'password' => [
                'required',
                'string',
                Password::min(8)
                    ->mixedCase()
                    ->numbers()
                    ->symbols()
            ],
            'profile_picture' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'confirm_password' => ['required', 'string', 'max:255', 'min:8'],
            'theme' => ['sometimes', 'string', 'in:system,light,dark'],
        ]);

        if ($request->password != $request->confirm_password) {
            return response()->json([
                'errors' => [
                    'confirm_password' => "Password doesn't match!"
                ]
            ], 422);
        }

        $user_data = [
            'name' => $request->name,
            'surname' => $request->surname,
            'email' => $request->email,
            'username' => $request->username,
            'password' => $request->password,
            'theme' => $request->input('theme', 'system'),
        ];

        if ($request->hasFile('profile_picture')) {
            $file = $request->file('profile_picture');
            $path = $file->storeAs('ProfilePictures', $request->username . "_" . $file->getClientOriginalName());

            $user_data['profile_picture_path'] = $path;
            $user_data['profile_picture_mime'] = $file->getClientMimeType();
        }

        $user = User::create($user_data);

        return response()->json([
            'status' => 'OK',
            'user' => $user->only([
                'id',
                'name',
                'surname',
                'username',
                'email',
                'theme',
                'profile_picture_url',
            ])
        ], 200);
    }

    public function me()
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        return response()->json([
            'status' => 'OK',
            'user' => $user->only([
                'id',
                'name',
                'surname',
                'username',
                'email',
                'theme',
                'profile_picture_url',
            ])
        ], 200);
    }

    public function logout(Request $request)
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'status' => 'OK'
        ], 200);
    }

    public function profilePicture($username)
    {
        $user = User::where('username', $username)->firstOrFail();

        if (!$user || !$user->profile_picture_path) {
            abort(404);
        }

        if (!Storage::disk('local')->exists($user->profile_picture_path)) {
            abort(404);
        }

        return response()->file(
            Storage::disk('local')->path($user->profile_picture_path)
        );
    }

    public function update(Request $request)
    {
        $user = $request->user();

        $validatedData = $request->validate([
            'name' => 'required|string|max:255',
            'surname' => 'required|string|max:255',
            'username' => 'required|string|max:255|unique:users,username,' . $user->id,
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'theme' => 'nullable|string|in:system,light,dark',
            'profile_picture' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'remove_image' => ['nullable'],
        ]);

        // LOGICA IMMAGINI

        // A. Se l'utente vuole rimuovere l'immagine attuale
        if ($request->boolean('remove_image')) {
            if ($user->profile_picture_path && Storage::disk('local')->exists($user->profile_picture_path)) {
                Storage::disk('local')->delete($user->profile_picture_path);
            }
            $validatedData['profile_picture_path'] = null;
            $validatedData['profile_picture_mime'] = null;
        }

        // B. Se l'utente sta caricando una NUOVA immagine (sovrascrive eventuale rimozione)
        if ($request->hasFile('profile_picture')) {
            // 1. Cancella la vecchia immagine se esiste (e se non è già stata tolta al passo A)
            //    Nota: controlliamo $user->getOriginal perché validatedData potrebbe averlo già settato a null sopra
            $oldPath = $user->getOriginal('profile_picture_path');
            if ($oldPath && Storage::disk('local')->exists($oldPath)) {
                Storage::disk('local')->delete($oldPath);
            }

            // 2. Salva la nuova
            $file = $request->file('profile_picture');
            // FIX: Specifica 'local' come terzo parametro per essere sicuri vada in private
            $path = $file->storeAs('ProfilePictures', $request->username . "_" . $file->getClientOriginalName(), 'local');

            // FIX CRITICO: Assegno a $validatedData, così user->update() lo salva davvero!
            $validatedData['profile_picture_path'] = $path;
            $validatedData['profile_picture_mime'] = $file->getClientMimeType();
        }

        // Aggiorna DB
        $user->update($validatedData);

        return response()->json([
            'message' => 'Profile updated successfully',
            // Ricarica user da DB per avere i dati freschi (incluso l'accessor URL)
            'user' => $user->fresh()->only(['id', 'name', 'surname', 'username', 'email', 'theme', 'profile_picture_url'])
        ]);
    }

    public function checkUsername(String $username)
    {
        $user = Auth::user();

        $exists = User::where('username', $username)
            ->where('id', '!=', $user->id)
            ->exists();

        return response()->json(['exists' => $exists]);
    }

    public function checkEmail(String $email)
    {
        $user = Auth::user();

        $exists = User::where('email', $email)
            ->where('id', '!=', $user->id)
            ->exists();

        return response()->json(['exists' => $exists]);
    }

    // public function updateTheme(Request $request): JsonResponse
    // {
    //     // 1. Validazione: Accettiamo solo i tre valori permessi
    //     $request->validate([
    //         'theme' => ['required', 'string', 'in:system,light,dark']
    //     ]);

    //     /** @var \App\Models\User $user */
    //     $user = Auth::user();

    //     // 2. Aggiornamento del dato
    //     $user->update([
    //         'theme' => $request->theme
    //     ]);

    //     // 3. Risposta
    //     return response()->json([
    //         'status' => 'OK',
    //         'message' => 'Theme updated successfully',
    //         'theme' => $user->theme
    //     ], 200);
    // }

    public function updatePassword(Request $request)
    {
        // 1. Controllo validazione
        $request->validate([
            'current_password' => ['required', 'string'],
            'new_password' => ['required', 'string', 'min:8', 'max:255', Password::min(8)
                ->mixedCase()
                ->numbers()
                ->symbols()],
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
