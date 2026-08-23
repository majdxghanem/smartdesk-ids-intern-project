<?php

namespace App\Mail;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class SmartDeskNotificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $recipient,
        public Notification $smartDeskNotification,
        public string $mailSubject,
        public ?string $actionUrl = null,
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(subject: $this->mailSubject);
    }

    public function content(): Content
    {
        return new Content(view: 'emails.smartdesk-notification');
    }
}
