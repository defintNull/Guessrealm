<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Str;

class ChatResource extends JsonResource
{
    protected $authUser; // qui salviamo l'ID utente

    public function __construct($resource, $authUser = null)
    {
        parent::__construct($resource);
        $this->authUser = $authUser; // può essere null o un ID
    }

    public function toArray(Request $request): array
    {
        // Data "letto fino a..." dalla pivot
        $lastReadAt = $this->pivot->last_read_at ?? '1970-01-01 00:00:00';

        // ID utente: prima quello passato, altrimenti quello del request (se esiste)
        $userId = $this->authUser ?? $request->user()?->id;

        // Se per qualche motivo è ancora null, evitiamo di rompere tutto
        if ($userId === null) {
            $unreadCount = 0;
        } else {
            $unreadCount = $this->messages()
                ->where('created_at', '>', $lastReadAt)
                ->where('user_id', '!=', $userId)
                ->count();
        }

        return [
            'id' => $this->id,
            'type' => $this->type,

            'name' => $this->display_name,
            'surname' => $this->display_surname,
            'avatar' => $this->display_avatar,

            'lastMessage' => $this->latestMessage
                ? Str::limit($this->latestMessage->content, 30)
                : 'Nessun messaggio',

            'time' => $this->latestMessage
                ? $this->latestMessage->created_at->format('H:i')
                : null,

            'latest_message' => new MessageResource($this->whenLoaded('latestMessage')),

            'unread' => $unreadCount,

            'users' => $this->whenLoaded('users'),
        ];
    }
}
