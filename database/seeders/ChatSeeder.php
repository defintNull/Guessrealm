<?php

namespace Database\Seeders;

use App\Models\Chat;
use App\Models\Message;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ChatSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Recuperiamo o creiamo gli utenti
        $users = User::all();
        if ($users->count() < 5) {
            $users = User::factory(10)->create();
        }

        // 2. Creiamo 10 chat (puoi cambiare il numero)
        for ($i = 0; $i < 10; $i++) {

            // A. Decidiamo PRIMA i partecipanti (da 2 a 6 persone a caso)
            // shuffle() mischia la collezione, take() ne prende un tot
            $members = $users->shuffle()->take(rand(2, 6));

            // B. Logica: Se sono più di 2 è un GRUPPO, altrimenti PRIVATA
            $isGroup = $members->count() > 2;

            $chat = Chat::create([
                'type' => $isGroup ? 'group' : 'private',
                // Se è un gruppo diamogli un nome finto, se privata deve essere null
                'name' => $isGroup ? 'Gruppo ' . fake()->word() : null,
            ]);

            // C. Inseriamo i partecipanti nella tabella pivot chat_user
            $chat->users()->attach($members->pluck('id'));

            // D. Creiamo dei messaggi finti per questa chat
            foreach (range(1, rand(5, 15)) as $msgIndex) {
                // Scegliamo un autore a caso tra i membri della chat
                $author = $members->random();

                // Generiamo il contenuto
                $content = fake()->sentence();

                // Creiamo il messaggio (con search_tokens se lo usi)
                Message::create([
                    'chat_id' => $chat->id,
                    'user_id' => $author->id,
                    'content' => $content,
                    // Se usi la logica search_tokens nel model (Observer) puoi ometterlo qui,
                    // altrimenti calcolalo al volo:
                    'search_tokens' => hash_hmac('sha256', Str::lower($content), config('app.key')),
                    'created_at' => fake()->dateTimeBetween('-1 month', 'now'),
                ]);
            }
        }
    }
}
