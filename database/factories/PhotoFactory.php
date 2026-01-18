<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Photo>
 */
class PhotoFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        // 50% di probabilità per vocale, 50% per consonante
        $shouldStartWithVowel = fake()->boolean();

        $name = $this->getNameStartingWith($shouldStartWithVowel);

        return [
            'name' => $name,
            'mime_type' => "image/jpeg",
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }

    private function getNameStartingWith(bool $vowel): string
    {
        $vowels = ['a', 'e', 'i', 'o', 'u'];
        $maxAttempts = 100;

        for ($i = 0; $i < $maxAttempts; $i++) {
            $name = fake()->firstName();
            $firstLetter = strtolower($name[0]);
            $startsWithVowel = in_array($firstLetter, $vowels);

            if ($startsWithVowel === $vowel) {
                return $name;
            }
        }

        // Fallback
        return $vowel ? 'A' . substr(fake()->firstName(), 1) : 'B' . substr(fake()->firstName(), 1);
    }
}
