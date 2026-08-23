<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PasswordResetCodeMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public User $recipient, public string $code)
    {
    }

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Your SmartDesk password reset code');
    }

    public function content(): Content
    {
        return new Content(view: 'emails.password-reset-code');
    }
}
