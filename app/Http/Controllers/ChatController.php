<?php

namespace App\Http\Controllers;

use App\Models\Chat;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\DB;
use App\Http\Resources\MessageResource;
use App\Http\Resources\ChatResource;
use Illuminate\Support\Str;

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
            ->with(['users', 'latestMessage'])
            ->get()
            ->sortByDesc('latestMessage.created_at');

        return ChatResource::collection($chats);
    }

    /**
     * 2. SHOW: Restituisce i MESSAGGI di una singola chat (Area destra)
     * Rotta: GET /api/chats/{chat}
     */
    public function show(Chat $chat)
    {
        Gate::authorize('view', $chat);

        $messages = $chat->messages()
            ->with('user')
            ->oldest()
            ->get();

        return MessageResource::collection($messages);
    }

    /**
     * 3. SEND MESSAGE: Invia un nuovo messaggio in una chat esistente
     * Rotta: POST /api/chats/{chat}
     * (Ho rinominato questo metodo da 'store' a 'sendMessage' per evitare conflitti)
     */
    public function sendMessage(Request $request, Chat $chat)
    {
        Gate::authorize('view', $chat);

        $data = $request->validate(['content' => 'required|string|max:2000']);

        $message = $chat->messages()->create([
            'user_id' => auth()->id(),
            'content' => $data['content'],
        ]);

        return new MessageResource($message->load('user'));
    }

    /**
     * 4. STORE: Crea una NUOVA chat (privata o gruppo)
     * Rotta: POST /api/chats
     */
    public function store(Request $request)
    {
        // ... validazione e variabili ...
        $data = $request->validate([
            'user_id' => 'required|exists:users,id',
            'type' => 'nullable|string|in:private,group',
            'name' => 'nullable|string',
        ]);
        $myId = auth()->id();
        $type = $data['type'] ?? 'private';

        // CASO A: CHAT PRIVATA
        if ($type === 'private') {
            $otherUserId = $data['user_id'];

            // 1. Controllo Idempotenza (FIX AMBIGUITY)
            $existingChat = Chat::where('type', 'private')
                ->whereHas('users', function ($q) use ($myId) {
                    // PRIMA ERA: $q->where('id', $myId);  <-- ERRORE
                    // ORA: specifichiamo la tabella
                    $q->where('users.id', $myId);
                })
                ->whereHas('users', function ($q) use ($otherUserId) {
                    // PRIMA ERA: $q->where('id', $otherUserId); <-- ERRORE
                    $q->where('users.id', $otherUserId);
                })
                ->first();

            if ($existingChat) {
                return new ChatResource($existingChat->load(['users', 'latestMessage']));
            }

            // Transazione per creare chat + associare utenti
            return DB::transaction(function () use ($myId, $otherUserId) {
                $chat = Chat::create(['type' => 'private']);
                $chat->users()->attach([$myId, $otherUserId]);
                return new ChatResource($chat->load(['users', 'latestMessage']));
            });
        }

        // --- CASO B: GRUPPO ---
        if ($type === 'group') {
            return DB::transaction(function () use ($myId, $data) {
                $chat = Chat::create([
                    'type' => 'group',
                    'name' => $data['name'] ?? 'Nuovo Gruppo',
                ]);

                $usersToAttach = [$myId];
                if (!empty($data['user_id'])) {
                    $usersToAttach[] = $data['user_id'];
                }
                $chat->users()->attach($usersToAttach);

                return new ChatResource($chat->load(['users', 'latestMessage']));
            });
        }
    }

    /**
     * 5. SEARCH: Cerca dentro una chat
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
