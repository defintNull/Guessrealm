<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Message;
use App\Models\Chat;
use Illuminate\Support\Facades\Auth;

class ChatController extends Controller
{
    //

    public function index($chatId){
        $user = Auth::user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $chat = Chat::find($chatId);
        if (!$chat) {
            return response()->json(['message' => 'Chat not found'], 404);
        }

        // Check if the user belongs to the chat (many-to-many)
        $belongs = $chat->users()->where('users.id', $user->id)->exists();
        if (!$belongs) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $messages = $chat->messages()->with('user')->orderBy('created_at')->get();
        return response()->json($messages);
    }

    public function store(Request $request, $chatId = null)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $data = $request->validate([
            'content' => 'required|string|max:2000',
            'chat_id' => 'nullable|integer|exists:chats,id',
        ]);

        $targetChatId = $data['chat_id'] ?? $chatId;
        if (!$targetChatId) {
            return response()->json(['message' => 'chat_id is required'], 422);
        }

        $chat = Chat::find($targetChatId);
        if (!$chat) {
            return response()->json(['message' => 'Chat not found'], 404);
        }

        // Check membership
        $belongs = $chat->users()->where('users.id', $user->id)->exists();
        if (!$belongs) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $message = Message::create([
            'chat_id' => $chat->id,
            'user_id' => $user->id,
            'content' => $data['content'],
        ]);

        return response()->json($message->load('user'), 201);
    }
}
