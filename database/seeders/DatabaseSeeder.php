<?php

namespace Database\Seeders;

use App\Models\Photo;
use App\Models\User;
use Illuminate\Database\Seeder;
use Database\Seeders\ChatSeeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // reminder, usare il comando:
        // php artisan migrate:fresh --seed

        // 1. CREAZIONE UTENTI REALI (Team + Prof)

        // Andrea Luca Di Simone (id = 1)
        User::factory()->create([
            'name' => 'Andrea Luca',
            'surname' => 'Di Simone',
            'email' => 'andrealuca.disimone@student.univaq.it',
            'email_verified_at' => now(),
            'username' => 'andrealuca.disimone',
            'password' => bcrypt('guessrealm'),
            'theme' => 'dark',
        ]);

        // Lorenzo D'Angelo (id = 2)
        User::factory()->create([
            'name' => 'Lorenzo',
            'surname' => "D'Angelo",
            'email' => 'lorenzo.dangelo1@student.univaq.it',
            'email_verified_at' => now(),
            'username' => 'lorenzo.dangelo',
            'password' => bcrypt('guessrealm'),
            'theme' => 'dark',
        ]);

        // Andrea Iannotti (id = 3)
        User::factory()->create([
            'name' => 'Andrea',
            'surname' => 'Iannotti',
            'email' => 'andrea.iannotti@student.univaq.it',
            'email_verified_at' => now(),
            'username' => 'andrea.iannotti',
            'password' => bcrypt('guessrealm'),
            'theme' => 'light',
        ]);

        // Prof Serafino Cicerone (id = 4)
        User::factory()->create([
            'name' => 'Serafino',
            'surname' => "Cicerone",
            'email' => 'serafino.cicerone@univaq.it',
            'email_verified_at' => now(),
            'username' => 'serafino.cicerone',
            'password' => bcrypt('frontend!'),
            'theme' => 'system',
        ]);

        // 2. CREAZIONE POPOLAZIONE EXTRA (Fondamentale per i gruppi!)
        // Creiamo altri 16 utenti random per avere circa 20 persone nel DB.
        // Questo permette al ChatSeeder di creare gruppi variati.
        User::factory(16)->create();
        $names = ["Alessia", "Antonio","Elisa","Beatrice","Camilla","Stefano",
                "Riccardo","Olivia","Giulia","Sara","Eva","Arianna",
                "Luca","Davide","Umberto","Elia","Francesca","Ilaria",
                "Veronica","Chiara","Alessandra","Bianca","Elena","Erica"];

        // 3. FOTO DEL GIOCO
        for ($i = 1; $i <= 24; $i++) {
            Photo::factory()->create([
                'path' => sprintf('GamePhotos/%06d.jpg', $i),
                'name' => $names[$i - 1] ?? 'Photo ' . $i,
            ]);
        }

        // 4. CHAT E MESSAGGI
        // Ora che abbiamo ~20 utenti, questo seeder funzionerà alla grande
        $this->call(ChatSeeder::class);
    }
}
