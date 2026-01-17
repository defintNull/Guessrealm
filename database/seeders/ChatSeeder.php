<?php

namespace Database\Seeders;

use App\Models\Chat;
use App\Models\Message;
use App\Models\User;
//use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ChatSeeder extends Seeder
{
    //use WithoutModelEvents;

    public function run(): void
    {
        $users = User::all();
        if ($users->isEmpty()) {
            $users = User::factory(10)->create();
        }

        // create some chats and attach random users
        Chat::factory(5)->create()->each(function (Chat $chat) use ($users) {
            $members = $users->random(rand(2, min(6, $users->count())));
            $chat->users()->attach($members->pluck('id')->toArray());

            // create messages from random members
            for ($i = 0; $i < 12; $i++) {
                $author = $members->random();
                Message::factory()->create([
                    'chat_id' => $chat->id,
                    'user_id' => $author->id,
                ]);
            }
        });
    }
}
