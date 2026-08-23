<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use App\Models\PasswordResetCode;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::call(function () {
    PasswordResetCode::where('expires_at', '<', now()->subDay())->delete();
})->daily()->name('purge-expired-password-reset-codes');
