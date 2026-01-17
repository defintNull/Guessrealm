<?php

namespace App\Http\Controllers;

use App\Models\Chat;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use App\Http\Resources\MessageResource;
use App\Http\Resources\ChatResource;
use Illuminate\Support\Str; // Nota la 'I' maiuscola

class ChatController extends Controller
{
    /**
     * 1. INDEX: Restituisce la LISTA delle chat (Sidebar sinistra)
     * Rotta: GET /api/chats
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $chats = $user->chats()
            ->with(['users', 'latestMessage']) // Eager Loading fondamentale
            ->get()
            ->sortByDesc('latestMessage.created_at'); // Ordina per messaggio più recente

        // Usiamo la Resource che contiene la logica di formattazione (nome, avatar, ecc.)
        // In questo modo eliminiamo la funzione 'list' che avevi scritto manualmente
        return ChatResource::collection($chats);
    }

    /**
     * 2. SHOW: Restituisce i MESSAGGI di una singola chat (Area destra)
     * Rotta: GET /api/chats/{chat}
     */
    public function show(Chat $chat)
    {
        // Importante: controlla se l'utente può vedere questa chat
        Gate::authorize('view', $chat);

        // Recupera i messaggi
        $messages = $chat->messages()
            ->with('user')
            ->oldest() // Ordine cronologico (dal più vecchio al più nuovo)
            ->get();

        return MessageResource::collection($messages);
    }

    /**
     * 3. STORE: Invia un nuovo messaggio
     * Rotta: POST /api/chats/{chat}/messages (o simile)
     */
    public function store(Request $request, Chat $chat)
    {
        Gate::authorize('view', $chat); // Usa la policy 'view' o una specifica 'createMessage'

        $data = $request->validate(['content' => 'required|string|max:2000']);

        $message = $chat->messages()->create([
            'user_id' => auth()->id(),
            'content' => $data['content'],
        ]);

        return new MessageResource($message->load('user'));
    }

    /**
     * 4. SEARCH: Cerca dentro una chat
     * Rotta: GET /api/chats/{chat}/search
     */
    public function search(Request $request, Chat $chat)
    {
        Gate::authorize('view', $chat);

        $query = $request->input('q');

        if (!$query) return response()->json([]);

        $searchToken = hash_hmac('sha256', Str::lower($query), config('app.key'));

        $messages = $chat->messages()
            ->whereJsonContains('search_tokens', $searchToken)
            ->with('user')
            ->get();

        return MessageResource::collection($messages);
    }
}
