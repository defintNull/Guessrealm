<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Message extends Model
{
    use HasFactory;

    protected $fillable = [
        'chat_id',
        'user_id',
        'content',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'content' => 'encrypted',
        'search_tokens' => 'array',
    ];

    public function chat()
    {
        return $this->belongsTo(Chat::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    protected static function booted(): void
    {
        static::creating(function (Message $message) {
            if ($message->content) {
                // 1. Normalizzazione: Tutto minuscolo per rendere la ricerca case-insensitive
                // "Ciao" e "ciao" devono generare lo stesso hash
                $cleanText = Str::lower($message->content);

                // 2. Pulizia: Rimuoviamo punteggiatura (virgole, punti, esclamativi)
                // Altrimenti "Ciao," sarebbe diverso da "Ciao"
                $cleanText = preg_replace('/[^\p{L}\p{N}\s]/u', '', $cleanText);

                // 3. Tokenizzazione: Esplodiamo la stringa in un array di parole
                $words = explode(' ', $cleanText);

                // 4. Hashing dei singoli token
                $tokens = [];
                foreach ($words as $word) {
                    // Opzionale: saltiamo le parole troppo corte (es. "e", "a", "il")
                    if (strlen($word) < 3) continue;

                    $tokens[] = hash_hmac('sha256', $word, config('app.key'));
                }

                // 5. Salviamo l'array pulito (rimuoviamo duplicati) come JSON
                $message->search_tokens = array_unique($tokens);
            }
        });
    }
}
