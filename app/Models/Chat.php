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
        'type', // 'private' o 'group'
    ];

    // ==========================================
    // RELAZIONI
    // ==========================================

    public function messages()
    {
        return $this->hasMany(Message::class);
    }

    public function users()
    {
        return $this->belongsToMany(User::class)
            ->withPivot('last_read_at')
            ->withTimestamps();
    }

    // Relazione ottimizzata per ottenere l'ultimo messaggio senza fare N+1 query pesanti
    public function latestMessage()
    {
        return $this->hasOne(Message::class)->latestOfMany();
    }

    // ==========================================
    // ACCESSORS & HELPERS
    // ==========================================

    /**
     * Helper virtuale: Restituisce l'altro utente della chat.
     * Funziona SOLO se la chat è privata.
     * Uso: $chat->other_user
     */
    public function getOtherUserAttribute()
    {
        // Se è un gruppo, non esiste un "altro utente" unico.
        if ($this->type === 'group') {
            return null;
        }

        // Se è privata, cerchiamo l'utente che NON sono io.
        return $this->users->first(fn($user) => $user->id !== Auth::id());
    }

    /**
     * Helper booleano per controllare velocemente il tipo nel frontend/backend
     * Uso: $chat->is_group
     */
    protected function isGroup(): Attribute
    {
        return Attribute::make(
            get: fn() => $this->type === 'group'
        );
    }

    /**
     * Accessor: Restituisce il NOME da visualizzare nell'interfaccia.
     * - Se Gruppo: Restituisce il nome del gruppo (es. "Calcetto").
     * - Se Privata: Restituisce il nome dell'interlocutore (es. "Mario").
     * Uso: $chat->display_name
     */
    protected function displayName(): Attribute
    {
        return Attribute::make(
            get: function () {
                if ($this->type === 'group') {
                    return $this->name ?? 'Gruppo senza nome';
                }

                // Fallback sicuro se l'altro utente è stato eliminato
                return $this->other_user?->name ?? 'Utente Sconosciuto';
            }
        );
    }

    /**
     * Accessor: Restituisce il COGNOME (Solo per chat private).
     * Serve per generare le iniziali corrette (es. Mario Rossi -> MR).
     * Uso: $chat->display_surname
     */
    protected function displaySurname(): Attribute
    {
        return Attribute::make(
            get: function () {
                if ($this->type === 'group') {
                    return null; // I gruppi non hanno cognome
                }

                return $this->other_user?->surname;
            }
        );
    }

    /**
     * Accessor: Restituisce l'AVATAR corretto.
     * - Se Gruppo: Restituisce null (o un'immagine di default per gruppi se ne hai una).
     * - Se Privata: Restituisce l'immagine profilo dell'utente.
     * Uso: $chat->display_avatar
     */
    protected function displayAvatar(): Attribute
    {
        return Attribute::make(
            get: function () {
                if ($this->type === 'group') {
                    return null; // O $this->image se aggiungi loghi ai gruppi
                }

                return $this->other_user?->profile_picture_url;
            }
        );
    }
}
