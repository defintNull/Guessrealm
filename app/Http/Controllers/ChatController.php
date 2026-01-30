<?php

namespace App\Http\Controllers;

use App\Events\ChatEvent;
use App\Events\ChatGroupEvent;
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
     * Return the chats of the current user
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
     * Return the message of a given chat of the current user
     */
    public function show(Request $request, Chat $chat)
    {
        Gate::authorize('view', $chat);

        // --- AGGIORNAMENTO LETTURA ---
        // Segniamo la chat come "letta" fino ad ora
        $chat->users()->updateExistingPivot($request->user()->id, [
            'last_read_at' => now()
        ]);

        $messages = $chat->messages()
            ->with('user')
            ->oldest()
            ->get();

        return MessageResource::collection($messages);
    }

    /**
     * Manage the logic for sending a message storing it in db and sending it through websocket
     */
    public function sendMessage(Request $request, Chat $chat)
    {
        Gate::authorize('view', $chat);

        $data = $request->validate(['content' => 'required|string|max:2000']);

        // 1. Crea Messaggio
        $message = $chat->messages()->create([
            'user_id' => $request->user()->id,
            'content' => $data['content'],
        ]);

        // 2. Aggiorna "last_read_at" per chi invia (così non conta come non letto per te)
        $chat->users()->updateExistingPivot($request->user()->id, [
            'last_read_at' => now()
        ]);

        // 3. Websocket
        $users = $chat->users;
        foreach($users as $user) {
            if($user->id == $request->user()->id) {
                continue;
            }
            broadcast(new ChatEvent($user->id, $message->load('user')));
        }

        return new MessageResource($message->load('user'));
    }

    /**
     * Manage the creation of a private chat or a group chat notifying other users through websocket
     */
    public function store(Request $request)
    {
        // 1. Validazione intelligente
        $data = $request->validate([
            'type' => 'required|string|in:private,group',
            'user_id' => 'required_if:type,private|exists:users,id',
            'name' => 'required_if:type,group|nullable|string|max:255',
            'users' => 'required_if:type,group|array|min:1',
            'users.*' => 'exists:users,id'
        ]);

        $myId = $request->user()->id;
        $type = $data['type'];

        // --- CASO A: CHAT PRIVATA ---
        if ($type === 'private') {
            $otherUserId = $data['user_id'];

            // Controllo Idempotenza
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

            return DB::transaction(function () use ($myId, $otherUserId, $request) {
                $chat = Chat::create(['type' => 'private']);

                // Attach con timestamp iniziali
                $chat->users()->attach([
                    $myId => ['last_read_at' => now()],
                    $otherUserId => ['last_read_at' => now()] // Anche l'altro parte da "letto" (vuoto)
                ]);

                $chat->load(['users', 'latestMessage']);

                // Websocket Notifica Nuova Chat
                $users = $chat->users;
                foreach($users as $user) {
                    if($user->id == $request->user()->id) continue;

                    broadcast(new ChatGroupEvent($user->id, $chat));
                }

                return new ChatResource($chat);
            });
        }

        // --- CASO B: GRUPPO ---
        if ($type === 'group') {
            return DB::transaction(function () use ($myId, $data, $request) {
                $chat = Chat::create([
                    'type' => 'group',
                    'name' => $data['name'],
                ]);

                $userIds = array_unique(array_merge([$myId], $data['users']));

                // Alleghiamo tutti inizializzando last_read_at
                $pivotData = array_fill_keys($userIds, ['last_read_at' => now()]);
                $chat->users()->attach($pivotData);

                $chat->load(['users', 'latestMessage']);

                foreach($userIds as $userId) {
                    broadcast(new ChatGroupEvent($userId, $chat));
                }

                return new ChatResource($chat);
            });
        }
    }

    /**
     * Search function to find users to chat with
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
