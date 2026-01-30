<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class UserController extends Controller
{
    /**
     * Return users for the chat group select
     */
    public function index(Request $request)
    {
        $search = $request->input('search');

        // Se non scrive nulla, restituiamo lista vuota (per non caricare tutti gli utenti del mondo)
        if (!$search) {
            return response()->json([]);
        }

        $users = User::where('id', '!=', Auth::user()->id) // Escludiamo noi stessi
            ->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('username', 'like', "%{$search}%"); // Se hai username
            })
            ->limit(10) // Limitiamo i risultati per performance
            ->get();

        return response()->json($users);
    }
}
