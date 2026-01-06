<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

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
        ]);

        $user->update($validatedData);

        return response()->json(['message' => 'Profile updated successfully', 'user' => $user->only(['id', 'name', 'surname', 'username', 'email'])]);
    }
}
