<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Str;

class ChatResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        // Recuperiamo la data "letto fino a..." dalla tabella pivot
        $lastReadAt = $this->pivot->last_read_at ?? '1970-01-01 00:00:00';

        // Contiamo quanti messaggi ci sono DOPO quella data (escludendo i miei)
        $unreadCount = $this->messages()
            ->where('created_at', '>', $lastReadAt)
            ->where('user_id', '!=', $request->user()->id)
            ->count();

        return [
            'id' => $this->id,
            'type' => $this->type,
            
            // Accessor del modello
            'name' => $this->display_name,
            'surname' => $this->display_surname,
            'avatar' => $this->display_avatar,

            // Formattazione messaggio sidebar
            'lastMessage' => $this->latestMessage
                ? Str::limit($this->latestMessage->content, 30)
                : 'Nessun messaggio',

            // Orario già formattato (Es. "17:30") -> Risolve il problema "Invalid Date"
            'time' => $this->latestMessage
                ? $this->latestMessage->created_at->format('H:i')
                : null,

            // Oggetto completo per aggiornamenti real-time
            'latest_message' => new MessageResource($this->whenLoaded('latestMessage')),

            // IL CONTEGGIO CALCOLATO QUI SOPRA
            'unread' => $unreadCount, 

            'users' => $this->whenLoaded('users'),
        ];
    }
}