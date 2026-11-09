<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\PasswordResetCodeMail;
use App\Models\PasswordResetCode;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rules\Password;

class PasswordResetController extends Controller
{
    private const GENERIC_MESSAGE = 'If an active account matches that email, you will receive a secure code shortly.';

    public function requestCode(Request $request)
    {
        $validated = $request->validate(['email' => ['required', 'email', 'max:255']]);

        // Report incomplete SMTP setup locally, without disclosing account existence.
        if (app()->environment('local') && ! $this->isSmtpConfigured()) {
            return response()->json([
                'message' => 'Email delivery is not configured. Check the Laravel SMTP settings and clear the configuration cache.',
            ], 503);
        }
        $email = mb_strtolower(trim($validated['email']));
        $user = User::whereRaw('LOWER(email) = ?', [$email])->first();

        if (!$user || $user->isbanned) {
            return response()->json(['message' => self::GENERIC_MESSAGE]);
        }

        $code = (string) random_int(100000, 999999);
        $resetCode = PasswordResetCode::create([
            'email' => $email,
            'code_hash' => Hash::make($code),
            'expires_at' => now()->addMinutes(10),
        ]);

        try {
            Mail::to($user->email)->send(new PasswordResetCodeMail($user, $code));
        } catch (\Throwable $exception) {
            // A failed send must not invalidate an earlier usable reset code.
            $resetCode->delete();
            Log::error('Password reset email delivery failed.', [
                'user_id' => $user->id,
                'exception' => $exception->getMessage(),
            ]);

            // Local development feedback only; production responses avoid user enumeration.
            if (app()->environment('local')) {
                return response()->json([
                    'message' => 'Could not send the reset email. Check SMTP settings and storage/logs/laravel.log.',
                ], 503);
            }

            return response()->json(['message' => self::GENERIC_MESSAGE]);
        }

        // Retire older codes only after the email transport accepts the new one.
        PasswordResetCode::where('email', $email)
            ->where('id', '!=', $resetCode->id)
            ->whereNull('used_at')
            ->update(['used_at' => now()]);

        return response()->json(['message' => self::GENERIC_MESSAGE]);
    }

    private function isSmtpConfigured(): bool
    {
        if (config('mail.default') !== 'smtp') {
            return false;
        }

        foreach (['mail.mailers.smtp.host', 'mail.mailers.smtp.username',
            'mail.mailers.smtp.password', 'mail.from.address'] as $setting) {
            if (blank(config($setting))) {
                return false;
            }
        }

        return true;
    }

    public function reset(Request $request)
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'max:255'],
            'code' => ['required', 'digits:6'],
            'password' => ['required', 'confirmed', Password::min(8)->mixedCase()->numbers()],
        ]);
        $email = mb_strtolower(trim($validated['email']));

        $result = DB::transaction(function () use ($email, $validated) {
            $reset = PasswordResetCode::where('email', $email)
                ->whereNull('used_at')
                ->latest('id')
                ->lockForUpdate()
                ->first();
            $user = User::whereRaw('LOWER(email) = ?', [$email])->first();

            if (!$reset || !$user || $user->isbanned || $reset->expires_at->isPast() || $reset->attempts >= 5) {
                return false;
            }

            if (!Hash::check($validated['code'], $reset->code_hash)) {
                $reset->increment('attempts');
                return false;
            }

            $user->update(['password' => Hash::make($validated['password'])]);
            $user->tokens()->delete();
            $reset->update(['used_at' => now()]);

            return true;
        });

        if (!$result) {
            return response()->json(['message' => 'The reset code is invalid or has expired. Request a new code and try again.'], 422);
        }

        return response()->json(['message' => 'Your password was reset successfully.']);
    }
}
