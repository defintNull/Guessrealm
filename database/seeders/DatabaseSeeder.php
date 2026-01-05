<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        //reminder, usare il comando
        //php artisan migrate:fresh --seed
        //droppa tutto,remigra e riesegue i seeder



        //utente Andrea Luca Di Simone id = 1
        User::factory()->create([
            'name' => 'Andrea Luca',
            'surname' => 'Di Simone',
            'email' => 'andrealuca.disimone@student.univaq.it',
            'email_verified_at' => now(),
            'username' => 'andrealuca.disimone',
            'password' => bcrypt('guessrealm'),
        ]);

        //utente Lorenzo D'Angelo id = 2
        User::factory()->create([
            'name' => 'Lorenzo',
            'surname' => "D'Angelo",
            'email' => 'lorenzo.dangelo1@student.univaq.it',
            'email_verified_at' => now(),
            'username' => 'lorenzo.dangelo',
            'password' => bcrypt('guessrealm'),
        ]);

        //utente Andrea iannotti  id = 3
        User::factory()->create([
            'name' => 'Andrea',
            'surname' => 'Iannotti',
            'email' => 'andrea.iannotti@student.univaq.it',
            'email_verified_at' => now(),
            'username' => 'andrea.iannotti',
            'password' => bcrypt('guessrealm'),
        ]);

        //utente prof Serafino Cicerone id = 4
        User::factory()->create([
            'name' => 'Serafino',
            'surname' => "Cicerone",
            'email' => 'serafino.cicerone@univaq.it',
            'email_verified_at' => now(),
            'username' => 'serafino.cicerone',
            'password' => bcrypt('frontend!'),
        ]);

        //User::factory(46)->create();

    }
}
