<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Resource to manage the messages during comunications
 */
class MessageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'      => $this->id,
            'content' => $this->content,
            'time'    => $this->created_at->format('H:i'), // Formattiamo la data per la chat
            'date'    => $this->created_at->toFormattedDateString(),
            // Gestiamo l'utente in modo sicuro
            'user'    => [
                'id'       => $this->user->id,
                'username' => $this->user->username,
                'avatar'   => $this->user->profile_picture_url, // Usiamo l'accessor che abbiamo creato!
            ],
        ];
    }
}
