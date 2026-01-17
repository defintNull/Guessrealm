<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Support\Facades\Auth;

class Chat extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'type',
    ];

    public function messages()
    {
        return $this->hasMany(Message::class);
    }

    public function users()
    {
        return $this->belongsToMany(User::class)->withTimestamps();
    }

    // Relazione per l'ultimo messaggio (Ottimizzata)
    public function latestMessage()
    {
        return $this->hasOne(Message::class)->latestOfMany();
    }

    /**
     * Helper per ottenere l'altro utente della chat (se privata)
     */
    public function getOtherUserAttribute()
    {
        // Se è un gruppo (ha un nome), non c'è un "altro utente" unico
        if ($this->name) {
            return null;
        }
        
        // Cerca il primo utente che NON è quello loggato
        return $this->users->first(fn($user) => $user->id !== Auth::id());
    }

    /**
     * Accessor: Restituisce il Nome da visualizzare (Titolo Gruppo o Nome Utente)
     * Uso: $chat->display_name
     */
    protected function displayName(): Attribute
    {
        return Attribute::make(
            get: function () {
                // Se la chat ha un nome (gruppo), usa quello. 
                // Altrimenti usa il nome dell'altro utente. 
                // Se l'altro utente non esiste (cancellato), fallback.
                return $this->name ?? $this->other_user?->name ?? 'Utente Sconosciuto';
            }
        );
    }

    /**
     * Accessor: Restituisce il Cognome (solo se chat privata)
     */
    protected function displaySurname(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->name ? null : $this->other_user?->surname
        );
    }

    /**
     * Accessor: Restituisce l'Avatar corretto
     */
    protected function displayAvatar(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->name ? null : $this->other_user?->profile_picture_url
        );
    }
}
