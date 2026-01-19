<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use App\Http\Resources\MessageResource; // Assicurati di importare la risorsa

class ChatEvent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(
        public int $user_id,    // Chi deve ricevere il messaggio
        public int $chat_id,    // A quale chat appartiene (FONDAMENTALE)
        public $message         // Il messaggio stesso
    )
    {}

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        // Canale privato dell'utente ricevente
        return [
            new PrivateChannel('chat.' . $this->user_id),
        ];
    }

    /**
     * Dati che arrivano a React (parametro 'e')
     */
    public function broadcastWith(): array
    {
        return [
            'chat_id' => $this->chat_id, // React userà e.chat_id
            'message' => $this->message, // React userà e.message
        ];
    }
    
    public function broadcastQueue(): string
    {
        return 'sync'; // Usiamo 'sync' per testare subito, poi puoi mettere 'default'
    }
}