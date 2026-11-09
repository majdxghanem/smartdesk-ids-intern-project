<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use App\Models\PasswordResetCode;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::call(function () {
    PasswordResetCode::where('expires_at', '<', now()->subDay())->delete();
})->daily()->name('purge-expired-password-reset-codes');

 
// Run after configuring the backend .env; no reset code or credentials are logged.
Artisan::command('smartdesk:mail-check {email : A mailbox you control for the test}', function () {
    $email = (string) $this->argument('email');

    if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $this->error('Provide a valid recipient email address.');
        return 1;
    }

    if (config('mail.default') !== 'smtp') {
        $this->error('MAIL_MAILER must be smtp for the Gmail SMTP check.');
        return 1;
    }

    $required = [
        'MAIL_HOST' => config('mail.mailers.smtp.host'),
        'MAIL_USERNAME' => config('mail.mailers.smtp.username'),
        'MAIL_PASSWORD' => config('mail.mailers.smtp.password'),
        'MAIL_FROM_ADDRESS' => config('mail.from.address'),
    ];
    $missing = array_keys(array_filter($required, fn ($value) => blank($value)));
    if ($missing) {
        $this->error('Missing mail settings: '.implode(', ', $missing));
        return 1;
    }

    try {
        Mail::raw('SmartDesk SMTP delivery test. No action is required.', function ($message) use ($email) {
            $message->to($email)->subject('SmartDesk email test');
        });
        $this->info('SMTP accepted the test message for '.$email.'. Check the inbox and spam folder.');
        return 0;
    } catch (\Throwable $exception) {
        Log::error('SmartDesk SMTP test failed.', ['exception' => $exception->getMessage()]);
        $this->error('SMTP could not send the test message: '.$exception->getMessage());
        return 1;
    }
})->purpose('Check configured SMTP email delivery from SmartDesk');
