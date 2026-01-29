<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Statistic;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Statistic>
 */
class StatisticFactory extends Factory
{
    protected $model = Statistic::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $wins = $this->faker->numberBetween(0, 50);
        $loses = $this->faker->numberBetween(0, 50);

        return [
            'wins' => $wins,
            'loses' => $loses,
            'games' => $wins + $loses,
            'level' => $this->faker->numberBetween(1, 50),
            'xp' => $this->faker->numberBetween(0, 99),
        ];
    }
}
