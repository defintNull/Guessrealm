<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules\Password;
use Symfony\Component\HttpFoundation\JsonResponse;

class AuthController extends Controller
{
    public function login(Request $request) : JsonResponse {
        $request->validate([
            'username' => ['required', 'string'],
            'password' => ['required', 'string']
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
                ]),
            ], 200);
        }

        return response()->json([
            'errors' => 'Wrong credentials!'
        ], 401);
    }

    public function register(Request $request) : JsonResponse {
        $request->validate([
            'name' => ['required', 'string'],
            'surname' => ['required', 'string'],
            'email' => ['required', 'email', 'unique:users,email'],
            'username' => ['required', 'string', 'unique:users,username'],
            'password' => ['required', 'string', Password::min(8)
                                                    ->mixedCase()
                                                    ->numbers()
                                                    ->symbols()
                                                ],
            'profile_picture' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'confirm_password' => ['required', 'string'],
            'theme',
        ]);

        if($request->password != $request->confirm_password) {
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
            'password' => $request->password
        ];

        if ($request->hasFile('profile_picture')) {
            $file = $request->file('profile_picture');
            $path = $file->storeAs('ProfilePictures', $request->username."_".$file->getClientOriginalName());

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
            ])
        ], 200);
    }

    public function me() {
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
            ])
        ], 200);
    }

    public function logout(Request $request) {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'status' => 'OK'
        ], 200);
    }

    public function profilePicture() {
        $user = Auth::user();

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
}
