<?php

use App\Jobs\ProcessNewPhoto;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/**
 * Schedule call to manage the update job
 */
Schedule::job(new ProcessNewPhoto())->everyThirtyMinutes();
