<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Statistic;
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
                'message' => 'Login successful',
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
            'status' => 'error',
            'message' => 'Wrong credentials'
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
        Statistic::create([
            'games' => 0,
            'wins' => 0,
            'loses' => 0,
            'level' => 0,
            'xp' => 0,
            'user_id' => $user->id
        ]);

        return response()->json([
            'status' => 'OK',
            'message' => 'Registration successful',
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
            'status' => 'OK',
            'message' => 'Logged out successfully'
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
        $path = Storage::disk('local')->path($user->profile_picture_path);
        $lastModified = Storage::disk('local')->lastModified($user->profile_picture_path);
        $etag = md5($user->profile_picture_path . '|' . $lastModified);

        // Handle conditional request
        if (request()->headers->get('If-None-Match') === $etag) {
            return response('', 304)->header('ETag', $etag)
                ->header('Cache-Control', 'public, max-age=3600');
        }

        return response()->file($path, [
            'Cache-Control' => 'public, max-age=3600',
            'ETag' => $etag,
        ]);
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

            // Forza l'aggiornamento di 'updated_at' anche se il path è identico a prima
            if ($user->profile_picture_path === $path) {
                $user->touch();
            }
        }

        // Aggiorna DB
        $user->update($validatedData);

        return response()->json([
            'status' => 'OK',
            'message' => 'Profile updated successfully',
            // Reload user from DB to get fresh data (including URL accessor)
            'user' => $user->fresh()->only(['id', 'name', 'surname', 'username', 'email', 'theme', 'profile_picture_url'])
        ]);
    }

    public function checkUsername(String $username)
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['exists' => User::where('username', $username)->exists()]);
        }

        $exists = User::where('username', $username)
            ->where('id', '!=', $user->id)
            ->exists();

        return response()->json(['exists' => $exists]);
    }

    public function checkEmail(String $email)
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['exists' => User::where('email', $email)->exists()]);
        }

        $exists = User::where('email', $email)
            ->where('id', '!=', $user->id)
            ->exists();

        return response()->json(['exists' => $exists]);
    }

    public function updatePassword(Request $request)
    {
        // Validation
        $request->validate([
            'current_password' => ['required', 'string'],
            'new_password' => ['required', 'string', 'min:8', 'max:255', Password::min(8)
                ->mixedCase()
                ->numbers()
                ->symbols()],
            'confirm_password' => ['required', 'same:new_password'],
        ]);

        $user = $request->user();

        // Check current password
        if (!Hash::check($request->current_password, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Password does not match our records.'],
            ]);
        }

        // Update password
        $user->update([
            'password' => Hash::make($request->new_password),
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Password updated successfully'
        ], 200);
    }
}
