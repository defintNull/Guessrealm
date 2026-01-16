<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Str;

class ChatResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        // Qui $this si riferisce all'oggetto Chat
        return [
            'id' => $this->id,
            // Usiamo gli Accessor creati nel modello
            'name' => $this->display_name,
            'surname' => $this->display_surname,
            'avatar' => $this->display_avatar,

            // Formattazione ultimo messaggio
            'lastMessage' => $this->latestMessage
                ? Str::limit($this->latestMessage->content, 30) // Laravel decrittografa in automatico qui!
                : 'Nessun messaggio',

            'time' => $this->latestMessage
                ? $this->latestMessage->created_at->format('H:i')
                : null,

            // Se in futuro implementi 'unread_count' nel modello, lo mappi qui
            'unread' => $this->unread_count ?? 0,
        ];
    }
}
