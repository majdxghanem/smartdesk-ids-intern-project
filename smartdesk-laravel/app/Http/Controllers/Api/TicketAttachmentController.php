<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use App\Models\TicketAttachment;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use App\Services\NotificationService;
use App\Models\ActivityLog;

class TicketAttachmentController extends Controller
{
    public function __construct(private NotificationService $notifications)
    {
    }
    public function index(Request $request, int $ticketId)
    {
        $ticket = Ticket::findOrFail($ticketId);
        $this->authorizeAccess($request->user(), $ticket);

        return response()->json([
            'attachments' => $ticket->attachments()
                ->with('user:id,firstname,username')
                ->get(),
        ]);
    }

    public function store(Request $request, int $ticketId)
    {
        $ticket = Ticket::findOrFail($ticketId);
        $this->authorizeAccess($request->user(), $ticket);
        $request->validate([
            'file' => [
                'required',
                'file',
                'max:10240',
                'mimes:pdf,png,jpg,jpeg,txt,csv,doc,docx,xls,xlsx,zip',
            ],
        ]);

        $file = $request->file('file');
        $extension = strtolower($file->getClientOriginalExtension());
        $safeName = Str::uuid().'.'.$extension;
        $originalName = preg_replace('/[\x00-\x1F\x7F]/u', '', basename($file->getClientOriginalName()));
        $originalName = Str::limit($originalName ?: "attachment.{$extension}", 250, '');
        $path = null;

        try {
            $path = $file->storeAs("ticket-attachments/{$ticket->id}", $safeName, 'local');

            if (!$path) {
                throw new \RuntimeException('The attachment could not be written to private storage.');
            }

            $attachment = DB::transaction(function () use ($ticket, $request, $file, $originalName, $path) {
                $attachment = TicketAttachment::create([
                    'ticketid' => $ticket->id,
                    'userid' => $request->user()->id,
                    'filename' => $originalName,
                    'filepath' => $path,
                    'filesize' => $file->getSize(),
                    'date' => now(),
                ]);

                ActivityLog::create([
                    'ticketid' => $ticket->id,
                    'user_id' => $request->user()->id,
                    'action' => "Added attachment: {$attachment->filename}.",
                    'date' => now(),
                ]);

                return $attachment;
            });
        } catch (\Throwable $exception) {
            if ($path) {
                Storage::disk('local')->delete($path);
            }

            Log::error('Ticket attachment upload failed.', [
                'ticket_id' => $ticket->id,
                'user_id' => $request->user()->id,
                'exception' => $exception->getMessage(),
            ]);

            return response()->json([
                'message' => 'The attachment could not be saved. Please try again.',
            ], 500);
        }

        $ticket->loadMissing(['creator', 'assignedUser', 'returnedTo']);
        $serviceLeads = User::where('isbanned', false)
            ->whereHas('role', fn ($query) => $query->whereIn('role', ['Admin', 'Manager']))
            ->get();
        $uploaderName = $request->user()->firstname ?: $request->user()->username;
        $this->notifications->send(
            collect([$ticket->creator, $ticket->assignedUser, $ticket->returnedTo])
                ->merge($serviceLeads)
                ->filter(fn ($recipient) => $recipient && $recipient->id !== $request->user()->id)
                ->unique('id'),
            'ticket_attachment',
            "{$uploaderName} added {$attachment->filename} to ticket #{$ticket->id}.",
            $ticket,
            "/tickets/{$ticket->id}",
            "New attachment on SmartDesk ticket #{$ticket->id}"
        );

        return response()->json([
            'message' => 'Attachment uploaded successfully.',
            'attachment' => $attachment->load('user:id,firstname,username'),
        ], 201);
    }

    public function download(Request $request, int $id)
    {
        $attachment = TicketAttachment::with('ticket')->findOrFail($id);
        $this->authorizeAccess($request->user(), $attachment->ticket);

        abort_unless(Storage::disk('local')->exists($attachment->filepath), 404, 'Attachment file not found.');

        return Storage::disk('local')->download($attachment->filepath, $attachment->filename);
    }

    public function destroy(Request $request, int $id)
    {
        $attachment = TicketAttachment::with('ticket')->findOrFail($id);
        $this->authorizeAccess($request->user(), $attachment->ticket);
        $request->user()->loadMissing('role');

        if ($request->user()->role?->role !== 'Admin' && (int) $attachment->userid !== (int) $request->user()->id) {
            return response()->json(['message' => 'Only the uploader or an administrator can remove this attachment.'], 403);
        }

        DB::transaction(function () use ($attachment, $request) {
            ActivityLog::create([
                'ticketid' => $attachment->ticketid,
                'user_id' => $request->user()->id,
                'action' => "Removed attachment: {$attachment->filename}.",
                'date' => now(),
            ]);
            $attachment->delete();
        });

        if (Storage::disk('local')->exists($attachment->filepath)
            && !Storage::disk('local')->delete($attachment->filepath)) {
            Log::warning('Attachment record removed but the private file could not be deleted.', [
                'attachment_id' => $attachment->id,
                'filepath' => $attachment->filepath,
            ]);
        }

        return response()->json(['message' => 'Attachment removed successfully.']);
    }

    private function authorizeAccess(User $user, Ticket $ticket): void
    {
        $user->loadMissing('role');
        $role = $user->role?->role;
        $allowed = in_array($role, ['Admin', 'Manager'], true)
            || ($role === 'Employee' && (int) $ticket->createdby === (int) $user->id)
            || ($role === 'IT Support Agent' && (int) $ticket->assignedto === (int) $user->id);

        abort_unless($allowed, 403, 'You do not have access to this ticket attachment.');
    }
}
