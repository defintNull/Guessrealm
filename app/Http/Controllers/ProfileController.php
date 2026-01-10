<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use \App\Models\User;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class ProfileController extends Controller
{

    public function update(Request $request)
    {
        $user = $request->user();

        // Validazione
        $validatedData = $request->validate([
            'name' => 'required|string|max:255',
            'surname' => 'required|string|max:255',
            'username' => 'required|string|max:255|unique:users,username,' . $user->id,
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'theme' => 'nullable|string|in:system,light,dark',
            'profile_picture' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'remove_image' => ['nullable'], // Aggiunto per validare il flag
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

    // todo delete profile picture
    public function deleteProfilePicture(Request $request) {}
}
