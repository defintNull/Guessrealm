<?php

namespace App\Jobs;

use App\Models\Photo;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

/**
 * Job that manage the update of the game photos and execure request to the python server for model analisys
 */
class ProcessNewPhoto implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Create a new job instance.
     */
    public function __construct()
    {
        $this->onQueue('low');
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        /** @var \Illuminate\Http\Client\Response $response */
        $response = Http::withHeaders([
            'User-Agent' => 'Mozilla/5.0'
        ])->timeout(10)->get('https://thispersondoesnotexist.com');

        if (!$response->successful()) {
            throw new \Exception("Errore nel download dell'immagine");
        }

        $filename = now()->timestamp . '.jpg';
        $path = "GamePhotos/$filename";

        Storage::disk('local')->put($path, $response->body());

        $photo = Photo::create([
            'path' => $path,
            'name' => "Paolo",
            'mime_type' => 'image/jpeg'
        ]);

        /** @var \Illuminate\Http\Client\Response $analysisResponse */
        $analysisResponse = Http::timeout(60)->attach(
            'file',
            Storage::disk('local')->get($path),
            'filename'
        )->post(config('services.python_api.url'));

        if (!$analysisResponse->successful()) {
            throw new \Exception("Errore dal servizio ML");
        }

        $gender = $analysisResponse->json('class_name') == "gender_male";
        $faker = fake();
        $photo->update([
            'name' => $gender ? $faker->firstNameMale() : $faker->firstNameFemale()
        ]);

        $count = Photo::count();
        if ($count > 1000) {
            $oldest = Photo::oldest()->first();
            if ($oldest) {
                Storage::disk('local')->delete($oldest->path);
                $oldest->delete();
            }
        }
    }
}
