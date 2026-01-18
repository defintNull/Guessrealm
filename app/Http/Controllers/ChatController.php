<?php

namespace App\Http\Controllers;

use App\Events\ChatEvent;
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
     */
    public function sendMessage(Request $request, Chat $chat)
    {
        Gate::authorize('view', $chat);

        $data = $request->validate(['content' => 'required|string|max:2000']);

        $message = $chat->messages()->create([
            'user_id' => $request->user()->id,
            'content' => $data['content'],
        ]);

        broadcast(new ChatEvent($message))->toOthers();
        return new MessageResource($message->load('user'));
    }

    /**
     * 4. STORE: Crea una NUOVA chat (privata o gruppo)
     * Rotta: POST /api/chats
     */
    public function store(Request $request)
    {
        // 1. Validazione intelligente
        $data = $request->validate([
            'type' => 'required|string|in:private,group',
            // Se è privata, serve user_id singolo
            'user_id' => 'required_if:type,private|exists:users,id',
            // Se è gruppo, serve name e un array di users
            'name' => 'required_if:type,group|nullable|string|max:255',
            'users' => 'required_if:type,group|array|min:1', // Almeno 1 altro utente oltre a te
            'users.*' => 'exists:users,id' // Ogni ID nell'array deve esistere
        ]);

        $myId = $request->user()->id;
        $type = $data['type'];

        // --- CASO A: CHAT PRIVATA ---
        if ($type === 'private') {
            $otherUserId = $data['user_id'];

            // Controllo Idempotenza (Se esiste già, ritornala)
            $existingChat = Chat::where('type', 'private')
                ->whereHas('users', function ($q) use ($myId) {
                    $q->where('users.id', $myId);
                })
                ->whereHas('users', function ($q) use ($otherUserId) {
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
                // 1. Creiamo la chat con il nome
                $chat = Chat::create([
                    'type' => 'group',
                    'name' => $data['name'],
                ]);

                // 2. Prepariamo la lista utenti (Io + quelli selezionati)
                // Usiamo array_unique per evitare duplicati se per sbaglio c'è il mio ID due volte
                $userIds = array_unique(array_merge([$myId], $data['users']));

                // 3. Alleghiamo tutti
                $chat->users()->attach($userIds);

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
