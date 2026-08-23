<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Status;
use App\Models\Ticket;
use App\Models\TicketComment;
use App\Models\TicketHistory;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;

class DashboardController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $user->load("role");

        $query = Ticket::query();

        switch ($user->role->role) {
            case "Admin":
            case "Manager":
                break;

            case "Employee":
                $query->where("createdby", $user->id);
                break;

            case "IT Support Agent":
                $query->where("assignedto", $user->id);
                break;

            default:
                return response()->json(
                    [
                        "message" => "Unauthorized.",
                    ],
                    403,
                );
        }

        $tickets = (clone $query)->get();

        $openId = Status::where("status", "Open")->value("id");
        $closedId = Status::where("status", "Closed")->value("id");

        $response = [
            "statistics" => [
                "open" => $tickets->where("statusid", $openId)->count(),
                "assigned" => $tickets->whereNotNull("assignedto")->count(),
                "closed" => $tickets->where("statusid", $closedId)->count(),
                "total" => $tickets->count(),
            ],

            "recentTickets" => (clone $query)
                ->with([
                    "priority",
                    "status",
                    "category",
                    "creator",
                    "assignedUser",
                ])
                ->latest("creation_date")
                ->take(5)
                ->get(),
        ];

        // The system-wide activity feed contains every ticket, so it is
        // deliberately returned only to administrators.
        if ($user->role->role === "Admin") {
            $response["activityLog"] = $this->adminActivityLog();
        }

        return response()->json($response);
    }

    /**
     * Build one newest-first timeline from every source of ticket activity.
     */
    private function adminActivityLog()
    {
        $activities = collect();

        $tickets = Ticket::with(["creator.role", "assignedUser.role"])
            ->orderByDesc("creation_date")
            ->orderByDesc("id")
            ->take(100)
            ->get();

        foreach ($tickets as $ticket) {
            $activities->push([
                "id" => "ticket-created-" . $ticket->id,
                "type" => "created",
                "action" => "Created the ticket.",
                "details" => null,
                "date" => $this->activityDate($ticket->creation_date),
                "ticket" => $this->formatTicket($ticket),
                "user" => $this->formatActivityUser($ticket->creator),
            ]);
        }

        $logs = ActivityLog::with(["ticket", "user.role"])
            ->orderByDesc("date")
            ->orderByDesc("id")
            ->take(100)
            ->get();

        foreach ($logs as $log) {
            if (!$log->ticket) {
                continue;
            }

            $action = strtolower($log->action);
            $type = str_contains($action, "closed")
                ? "closed"
                : (str_contains($action, "returned")
                    ? "returned"
                    : "updated");

            $activities->push([
                "id" => "log-" . $log->id,
                "type" => $type,
                "action" => $log->action,
                "details" => null,
                "date" => $this->activityDate($log->date),
                "ticket" => $this->formatTicket($log->ticket),
                "user" => $this->formatActivityUser($log->user),
            ]);
        }

        $histories = TicketHistory::with([
            "ticket",
            "assignedBy.role",
            "assignedTo.role",
        ])
            ->orderByDesc("assigneddate")
            ->orderByDesc("id")
            ->take(100)
            ->get();

        foreach ($histories as $history) {
            if (!$history->ticket) {
                continue;
            }

            $reason = strtolower($history->reason ?? "");
            $assignedToName = $this->activityUserName($history->assignedTo);

            if (str_contains($reason, "returned")) {
                $type = "returned";
                $action = "Returned the ticket to " . $assignedToName . ".";
            } elseif (str_contains($reason, "claimed")) {
                $type = "claimed";
                $action = "Claimed the ticket.";
            } else {
                $type = "assigned";
                $action = "Assigned the ticket to " . $assignedToName . ".";
            }

            $activities->push([
                "id" => "history-" . $history->id,
                "type" => $type,
                "action" => $action,
                "details" => $history->reason,
                "date" => $this->activityDate($history->assigneddate),
                "ticket" => $this->formatTicket($history->ticket),
                "user" => $this->formatActivityUser($history->assignedBy),
            ]);
        }

        $comments = TicketComment::with(["ticket", "user.role"])
            ->orderByDesc("date")
            ->orderByDesc("id")
            ->take(100)
            ->get();

        foreach ($comments as $comment) {
            if (!$comment->ticket) {
                continue;
            }

            $isReply = $comment->parentid !== null;

            $activities->push([
                "id" => "comment-" . $comment->id,
                "type" => $isReply ? "reply" : "comment",
                "action" => $isReply
                    ? "Replied to a comment."
                    : "Added a comment.",
                "details" => $comment->comment,
                "date" => $this->activityDate($comment->date),
                "ticket" => $this->formatTicket($comment->ticket),
                "user" => $this->formatActivityUser($comment->user),
            ]);
        }

        $historiesByTicket = $histories->groupBy("ticketid");
        $closedTicketIds = $logs
            ->filter(function (ActivityLog $log) {
                return str_contains(strtolower($log->action), "closed");
            })
            ->pluck("ticketid")
            ->map(fn($id) => (int) $id)
            ->all();

        foreach ($tickets as $ticket) {
            // Older and seeded assignments can predate history tracking.
            if (
                $ticket->assignedto !== null &&
                !$historiesByTicket->has($ticket->id)
            ) {
                $activities->push([
                    "id" => "legacy-assignment-" . $ticket->id,
                    "type" => "assigned",
                    "action" =>
                        "Was assigned to " .
                        $this->activityUserName($ticket->assignedUser) .
                        ".",
                    "details" =>
                        "Assignment restored from existing ticket data.",
                    "date" => $this->activityDate(
                        $ticket->update_date ?: $ticket->creation_date,
                    ),
                    "ticket" => $this->formatTicket($ticket),
                    "user" => null,
                ]);
            }

            // Older closed tickets can predate close-action logging.
            if (
                $ticket->closed_date &&
                !in_array((int) $ticket->id, $closedTicketIds, true)
            ) {
                $activities->push([
                    "id" => "legacy-closed-" . $ticket->id,
                    "type" => "closed",
                    "action" => "Closed the ticket.",
                    "details" => null,
                    "date" => $this->activityDate($ticket->closed_date),
                    "ticket" => $this->formatTicket($ticket),
                    "user" => $this->formatActivityUser($ticket->assignedUser),
                ]);
            }
        }

        return $activities
            ->sort(function (array $first, array $second) {
                $dateComparison = strcmp($second["date"], $first["date"]);

                return $dateComparison !== 0
                    ? $dateComparison
                    : strcmp((string) $second["id"], (string) $first["id"]);
            })
            ->take(50)
            ->values();
    }

    private function formatTicket(Ticket $ticket): array
    {
        return [
            "id" => $ticket->id,
            "title" => $ticket->title,
        ];
    }

    private function formatActivityUser(?User $user): ?array
    {
        if (!$user) {
            return null;
        }

        $user->loadMissing("role");

        return [
            "id" => $user->id,
            "firstname" => $user->firstname,
            "username" => $user->username,
            "role" => $user->role?->role,
        ];
    }

    private function activityUserName(?User $user): string
    {
        if (!$user) {
            return "an unknown user";
        }

        return $user->firstname ?: ($user->username ?: "User #" . $user->id);
    }

    private function activityDate($value): string
    {
        return Carbon::parse($value)->toISOString();
    }
}
