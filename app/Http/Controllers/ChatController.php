<?php

namespace App\Http\Controllers;

use App\Models\Chat;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use App\Http\Resources\MessageResource;


class ChatController extends Controller
{
    public function index(Chat $chat)
    {
        Gate::authorize('view', $chat);

        $messages = $chat->messages()->with('user')->oldest()->get();

        // Restituiamo una collezione di messaggi
        return MessageResource::collection($messages);
    }

    public function store(Request $request, Chat $chat)
    {
        Gate::authorize('createMessage', $chat);
        $data = $request->validate(['content' => 'required|string|max:2000']);

        $message = $chat->messages()->create([
            'user_id' => auth()->id(),
            'content' => $data['content'],
        ]);

        // Restituiamo un singolo messaggio
        return new MessageResource($message->load('user'));
    }
}
