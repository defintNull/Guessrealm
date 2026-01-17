<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Chat;

class ChatPolicy
{
    /**
     * Create a new policy instance.
     */
    public function __construct()
    {
        //
    }

    public function view(User $user, Chat $chat)
    {
        return $chat->users()->where('users.id', $user->id)->exists();
        // return true;
    }

    public function createMessage(User $user, Chat $chat)
    {
        return $chat->users()->where('users.id', $user->id)->exists();
        // return true;
    }
}
