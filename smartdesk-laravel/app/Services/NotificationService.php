<?php

namespace App\Services;

use App\Mail\SmartDeskNotificationMail;
use App\Models\Notification;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class NotificationService
{
    public function send(
        iterable $recipients,
        string $type,
        string $message,
        Ticket $ticket,
        ?string $actionPath = null,
        string $subject = 'SmartDesk update',
    ): void {
        $sentTo = [];

        foreach ($recipients as $recipient) {
            if (!$recipient instanceof User || $recipient->isbanned || in_array($recipient->id, $sentTo, true)) {
                continue;
            }

            $sentTo[] = $recipient->id;
            $notification = null;

            try {
                $notification = Notification::create([
                    'userid' => $recipient->id,
                    'ticketid' => $ticket->id,
                    'type' => $type,
                    'message' => $message,
                    'action_url' => $actionPath,
                    'date' => now(),
                ]);
                $fullActionUrl = $actionPath
                    ? rtrim((string) config('app.frontend_url'), '/').'/'.ltrim($actionPath, '/')
                    : null;
                Mail::to($recipient->email)->send(
                    new SmartDeskNotificationMail($recipient, $notification, $subject, $fullActionUrl)
                );
                $notification->update(['email_sent_at' => now()]);
            } catch (\Throwable $exception) {
                Log::error('SmartDesk notification delivery failed.', [
                    'notification_id' => $notification?->id,
                    'user_id' => $recipient->id,
                    'exception' => $exception->getMessage(),
                ]);
            }
        }
    }
}
