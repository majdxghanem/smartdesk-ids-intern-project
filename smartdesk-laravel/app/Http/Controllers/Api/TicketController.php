<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTicketRequest;
use App\Models\Ticket;
use App\Models\TicketHistory;
use App\Models\ActivityLog;
use App\Models\TicketComment;
use App\Models\User;
use App\Models\Status;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Http\Requests\UpdateTicketRequest;
use Illuminate\Http\Request;
use Carbon\Carbon;
use App\Services\NotificationService;

class TicketController extends Controller
{
    public function __construct(private NotificationService $notifications)
    {
    }
    /**
     * Get all IT support agents for the assignment page.
     */
    public function agents()
    {
        $user = Auth::user();
        $user->load('role');

        if (
            !$user->role ||
            !in_array($user->role->role, ['Admin', 'Manager'])
        ) {
            return response()->json([
                'message' => 'Only administrators and managers can view IT support agents.'
            ], 403);
        }

        $agents = User::whereHas('role', function ($query) {
                $query->where('role', 'IT Support Agent');
            })
            ->where('isbanned', false)
            ->select('id', 'firstname', 'username', 'email')
            ->orderBy('firstname')
            ->get();

        return response()->json([
            'agents' => $agents
        ]);
    }

    /**
     * Get tickets based on user role.
     */
    public function index(Request $request)
    {
        $user = Auth::user();
    $user->load('role');

    $query = Ticket::with([
        'creator',
        'assignedUser',
        'returnedTo',
        'priority',
        'status',
        'category'
    ]);

    switch ($user->role->role) {

        case 'Admin':
            if (request('assigned') === 'unassigned') {
                $query->whereNull('assignedto')->whereNull('returnedto');
            } elseif (request('assigned') === 'returned') {
                $query->whereNotNull('returnedto');
            }
            break;

        case 'Manager':
            if (request('assigned') === 'returned') {
                $query->where('returnedto', $user->id);
            }
            break;

        case 'Employee':
            $query->where('createdby', $user->id);
            break;

        case 'IT Support Agent':
             if (request('assigned') === 'unassigned') {
            $query->whereNull('assignedto')->whereNull('returnedto');
        } else {
            $query->where('assignedto', $user->id);
        }

        break;

        default:
            return response()->json([
                'message' => 'Unauthorized.'
            ], 403);
    }

    if (request()->filled('statusid')) {
        $query->where('statusid', request('statusid'));
    }

    if (request()->filled('priorityid')) {
        $query->where('priorityid', request('priorityid'));
    }

    if (request()->filled('categoryid')) {
        $query->where('categoryid', request('categoryid'));
    }

    if (request()->filled('date')) {
        $query->whereDate('creation_date', request('date'));
    }

    if ($request->filled('search')) {
        $search = trim((string) $request->query('search'));
        $query->where(function ($subquery) use ($search) {
            $subquery->where('title', 'like', "%{$search}%")
                ->orWhere('description', 'like', "%{$search}%");

            if (ctype_digit($search)) {
                $subquery->orWhere('id', (int) $search);
            }
        });
    }

    if (request('sort', 'newest') === 'newest') {
        $query->orderByDesc('creation_date')
            ->orderByDesc('id');
    } else {
        $query->orderBy('creation_date')->orderBy('id');
    }

    $perPage = min(max((int) $request->query('per_page', 20), 5), 100);
    $tickets = $query->paginate($perPage);

    return response()->json([
        'tickets' => $tickets->items(),
        'pagination' => [
            'current_page' => $tickets->currentPage(),
            'last_page' => $tickets->lastPage(),
            'per_page' => $tickets->perPage(),
            'total' => $tickets->total(),
        ],
    ]);
    }

    /**
     * Create a new ticket.
     */
    public function store(StoreTicketRequest $request)
    {
        $user = Auth::user();

        $user->load('role');

        // Only Admin and Employee can create tickets
        if (!in_array($user->role->role, ['Admin', 'Employee'])) {

            return response()->json([
                'message' => 'You are not allowed to create tickets.'
            ], 403);
        }

        // Find Open status
        $openStatus = Status::where('status', 'Open')->first();

        if (!$openStatus) {
            return response()->json([
                'message' => 'Open status not found.'
            ], 500);
        }

        $ticket = Ticket::create([

            'priorityid' => $request->priorityid,

            'statusid' => $openStatus->id,

            'categoryid' => $request->categoryid,

            'createdby' => $user->id,

            'assignedto' => null,

            'returnedto' => null,

            'creation_date' => now(),

            'update_date' => null,

            'closed_date' => null,

            'title' => $request->title,

            'description' => $request->description,
        ]);

        $recipients = User::where('isbanned', false)
            ->where('id', '!=', $user->id)
            ->whereHas('role', fn ($query) => $query->whereIn('role', ['Admin', 'Manager']))
            ->get();
        $this->notifications->send(
            $recipients,
            'ticket_created',
            "A new ticket #{$ticket->id} was created: {$ticket->title}",
            $ticket,
            "/tickets/{$ticket->id}",
            "New SmartDesk ticket #{$ticket->id}"
        );

        return response()->json([
            'message' => 'Ticket created successfully.',
            'ticket' => $ticket
        ], 201);
    }

    
    
    public function show($id)
{
    $user = Auth::user();
    $user->load('role');

    $ticket = Ticket::with([
        'creator',
        'assignedUser',
        'returnedTo',
        'priority',
        'status',
        'category'
    ])->find($id);

    if (!$ticket) {
        return response()->json([
            'message' => 'Ticket not found.'
        ], 404);
    }

    switch ($user->role->role) {

        case 'Admin':
        case 'Manager':
            break;

        case 'Employee':
            if ($ticket->createdby != $user->id) {
                return response()->json([
                    'message' => 'Unauthorized.'
                ], 403);
            }
            break;

        case 'IT Support Agent':
            if ($ticket->assignedto != $user->id) {
                return response()->json([
                    'message' => 'Unauthorized.'
                ], 403);
            }
            break;

        default:
            return response()->json([
                'message' => 'Unauthorized.'
            ], 403);
    }

    return response()->json($ticket);
}
public function update(UpdateTicketRequest $request, $id)
{
    $user = Auth::user();
    $user->load('role');

    $ticket = Ticket::find($id);

    if (!$ticket) {
        return response()->json([
            'message' => 'Ticket not found.'
        ],404);
    }

    $before = $this->ticketSnapshot($ticket);

    switch ($user->role->role) {

        case 'Admin':

            if ($request->has('assignedto')) {
                return response()->json([
                    'message' => 'Use the assignment action to change ticket ownership.'
                ], 422);
            }

            $ticket->update([
                'title' => $request->title ?? $ticket->title,
                'description' => $request->description ?? $ticket->description,
                'priorityid' => $request->priorityid ?? $ticket->priorityid,
                'categoryid' => $request->categoryid ?? $ticket->categoryid,
                'statusid' => $request->statusid ?? $ticket->statusid,
                'update_date' => now(),
            ]);

            break;

        case 'Manager':

            if ($request->hasAny([
                'title',
                'description',
                'priorityid',
                'assignedto'
            ])) {
                return response()->json([
                    'message' => 'Managers can edit only status and category.'
                ], 403);
            }

            $ticket->update([
                'categoryid' => $request->categoryid ?? $ticket->categoryid,
                'statusid' => $request->statusid ?? $ticket->statusid,
                'update_date' => now(),
            ]);

            break;

        case 'Employee':

            if ($ticket->createdby != $user->id) {

                return response()->json([
                    'message'=>'Unauthorized.'
                ],403);

            }

            if ($ticket->assignedto !== null) {

                return response()->json([
                    'message'=>'Assigned tickets can no longer be edited.'
                ],403);

            }

            $openStatus = Status::where('status','Open')->first();

            if ($ticket->statusid != $openStatus->id) {

                return response()->json([
                    'message'=>'Only Open tickets can be edited.'
                ],403);

            }

            $ticket->update([
                'title' => $request->title ?? $ticket->title,
                'description' => $request->description ?? $ticket->description,
                'priorityid' => $request->priorityid ?? $ticket->priorityid,
                'categoryid' => $request->categoryid ?? $ticket->categoryid,
                'update_date' => now(),
            ]);

            break;

        case 'IT Support Agent':

            if ($ticket->assignedto != $user->id) {

                return response()->json([
                    'message'=>'Unauthorized.'
                ],403);

            }

            if ($request->hasAny([
                'title',
                'description',
                'statusid',
                'assignedto'
            ])) {
                return response()->json([
                    'message' => 'IT Support Agents can edit only priority and category.'
                ], 403);
            }

            $ticket->update([
                'priorityid' => $request->priorityid ?? $ticket->priorityid,
                'categoryid' => $request->categoryid ?? $ticket->categoryid,
                'update_date' => now(),
            ]);

            break;

        default:

            return response()->json([
                'message'=>'Unauthorized.'
            ],403);

    }

    if ($request->has('statusid')) {
        $statusName = Status::find($ticket->statusid)?->status;
        $ticket->closed_date = $statusName === 'Closed'
            ? ($ticket->closed_date ?: now())
            : null;
        $ticket->save();
    }

    $this->recordTicketChanges($ticket, $before, $user);

    if ($this->ticketSnapshot($ticket) !== $before) {
        $this->notifications->send(
            $this->ticketRecipients($ticket, $user->id),
            'ticket_updated',
            "Ticket #{$ticket->id} was updated by {$this->activityUserName($user)}.",
            $ticket,
            "/tickets/{$ticket->id}",
            "SmartDesk ticket #{$ticket->id} updated"
        );
    }

    return response()->json([
        'message'=>'Ticket updated successfully.',
        'ticket'=>$ticket->fresh([
            'creator',
            'assignedUser',
            'returnedTo',
            'priority',
            'status',
            'category'
        ])
    ]);
}
public function destroy($id)
{
    $user = Auth::user();
    $user->load('role');

    if($user->role->role != 'Admin'){

        return response()->json([
            'message'=>'Only administrators can archive tickets.'
        ],403);

    }

    $ticket = Ticket::find($id);

    if(!$ticket){

        return response()->json([
            'message'=>'Ticket not found.'
        ],404);

    }

    $this->notifications->send(
        $this->ticketRecipients($ticket, $user->id),
        'ticket_archived',
        "Ticket #{$ticket->id} was archived by {$this->activityUserName($user)}.",
        $ticket,
        '/tickets',
        "SmartDesk ticket #{$ticket->id} archived"
    );
    ActivityLog::create([
        'ticketid' => $ticket->id,
        'user_id' => $user->id,
        'action' => 'Archived the ticket.',
        'date' => now(),
    ]);
    $ticket->delete();

    return response()->json([
        'message'=>'Ticket archived successfully.'
    ]);
}

public function archived(Request $request)
{
    $request->user()->load('role');

    if ($request->user()->role?->role !== 'Admin') {
        return response()->json(['message' => 'Only administrators can view archived tickets.'], 403);
    }

    $query = Ticket::onlyTrashed()
        ->with(['creator', 'assignedUser', 'returnedTo', 'priority', 'status', 'category']);

    if ($request->filled('search')) {
        $search = trim((string) $request->query('search'));
        $query->where(function ($subquery) use ($search) {
            $subquery->where('title', 'like', "%{$search}%")
                ->orWhere('description', 'like', "%{$search}%");
            if (ctype_digit($search)) $subquery->orWhere('id', (int) $search);
        });
    }

    $tickets = $query
        ->orderByDesc('deleted_at')
        ->paginate(min(max((int) $request->query('per_page', 20), 5), 100));

    return response()->json($tickets);
}

public function restore(Request $request, int $id)
{
    $request->user()->load('role');

    if ($request->user()->role?->role !== 'Admin') {
        return response()->json(['message' => 'Only administrators can restore tickets.'], 403);
    }

    $ticket = Ticket::onlyTrashed()->findOrFail($id);
    $ticket->restore();

    ActivityLog::create([
        'ticketid' => $ticket->id,
        'user_id' => $request->user()->id,
        'action' => 'Restored the ticket.',
        'date' => now(),
    ]);

    $this->notifications->send(
        $this->ticketRecipients($ticket, $request->user()->id),
        'ticket_restored',
        "Ticket #{$ticket->id} was restored by {$this->activityUserName($request->user())}.",
        $ticket,
        "/tickets/{$ticket->id}",
        "SmartDesk ticket #{$ticket->id} restored"
    );

    return response()->json([
        'message' => 'Ticket restored successfully.',
        'ticket' => $ticket->fresh(['creator', 'assignedUser', 'returnedTo', 'priority', 'status', 'category']),
    ]);
}
public function close($id)
{
    $user = Auth::user();
    $user->load('role');

    $ticket = Ticket::find($id);

    if (!$ticket) {
        return response()->json([
            'message' => 'Ticket not found.'
        ], 404);
    }

    if (
        !$user->role ||
        $user->role->role !== 'IT Support Agent' ||
        $ticket->assignedto != $user->id
    ) {
        return response()->json([
            'message' => 'Only the assigned IT Support Agent can close this ticket.'
        ], 403);
    }

    $inProgressStatus = Status::where('status', 'In Progress')->first();
    $closedStatus = Status::where('status', 'Closed')->first();

    if (!$inProgressStatus || !$closedStatus) {
        return response()->json([
            'message' => 'Required ticket statuses were not found.'
        ], 500);
    }

    if ($ticket->statusid != $inProgressStatus->id) {
        return response()->json([
            'message' => 'Only In Progress tickets can be closed.'
        ], 409);
    }

    DB::transaction(function () use ($ticket, $closedStatus, $user) {
        $ticket->statusid = $closedStatus->id;
        $ticket->closed_date = now();
        $ticket->update_date = now();
        $ticket->save();

        ActivityLog::create([
            'ticketid' => $ticket->id,
            'user_id' => $user->id,
            'action' => 'Closed the ticket.',
            'date' => now()
        ]);
    });

    $this->notifications->send(
        $this->ticketRecipients($ticket, $user->id),
        'ticket_closed',
        "Ticket #{$ticket->id} was resolved and closed by {$this->activityUserName($user)}.",
        $ticket,
        "/tickets/{$ticket->id}",
        "SmartDesk ticket #{$ticket->id} closed"
    );

    return response()->json([
        'message' => 'Ticket closed successfully.',
        'ticket' => $ticket->fresh([
            'creator',
            'assignedUser',
            'returnedTo',
            'priority',
            'status',
            'category'
        ])
    ]);
}
public function returnTicket($id)
{
    $user = Auth::user();
    $user->load('role');

    $ticket = Ticket::find($id);

    if (!$ticket) {
        return response()->json([
            'message' => 'Ticket not found.'
        ], 404);
    }

    if (
        !$user->role ||
        $user->role->role !== 'IT Support Agent' ||
        $ticket->assignedto != $user->id
    ) {
        return response()->json([
            'message' => 'Only the assigned IT Support Agent can return this ticket.'
        ], 403);
    }

    $inProgressStatus = Status::where('status', 'In Progress')->first();
    $returnedStatus = Status::where('status', 'Returned')->first();

    if (!$inProgressStatus || !$returnedStatus) {
        return response()->json([
            'message' => 'Required ticket statuses were not found.'
        ], 500);
    }

    if ($ticket->statusid != $inProgressStatus->id) {
        return response()->json([
            'message' => 'Only In Progress tickets can be returned.'
        ], 409);
    }

    $lastAssignment = TicketHistory::where('ticketid', $ticket->id)
        ->where('assignedto', $user->id)
        ->whereHas('assignedBy', function ($query) {
            $query->where('isbanned', false)
                ->whereHas('role', function ($roleQuery) {
                    $roleQuery->whereIn('role', ['Admin', 'Manager']);
                });
        })
        ->orderByDesc('assigneddate')
        ->orderByDesc('id')
        ->first();

    $returnTo = $lastAssignment
        ? User::with('role')->find($lastAssignment->assignedby)
        : null;

    // Legacy and seeded tickets may predate assignment-history tracking.
    if (!$returnTo) {
        $returnTo = User::with('role')
            ->where('isbanned', false)
            ->whereHas('role', function ($query) {
                $query->whereIn('role', ['Admin', 'Manager']);
            })
            ->get()
            ->sortBy(function ($candidate) {
                return $candidate->role->role === 'Admin' ? 0 : 1;
            })
            ->first();
    }

    if (!$returnTo) {
        return response()->json([
            'message' => 'No active administrator or manager is available to receive this ticket.'
        ], 409);
    }

    DB::transaction(function () use ($ticket, $returnedStatus, $returnTo, $user) {
        $ticket->assignedto = null;
        $ticket->returnedto = $returnTo->id;
        $ticket->statusid = $returnedStatus->id;
        $ticket->closed_date = null;
        $ticket->update_date = now();
        $ticket->save();

        TicketHistory::create([
            'ticketid' => $ticket->id,
            'assignedby' => $user->id,
            'assignedto' => $returnTo->id,
            'assigneddate' => now(),
            'reason' => 'Ticket returned by IT Support Agent.'
        ]);
    });

    $this->notifications->send(
        $this->ticketRecipients($ticket, $user->id),
        'ticket_returned',
        "Ticket #{$ticket->id} was returned for review by {$this->activityUserName($user)}.",
        $ticket,
        "/tickets/{$ticket->id}",
        "SmartDesk ticket #{$ticket->id} returned"
    );

    return response()->json([
        'message' => 'Ticket returned successfully.',
        'ticket' => $ticket->fresh([
            'creator',
            'assignedUser',
            'returnedTo',
            'priority',
            'status',
            'category'
        ])
    ]);
}
public function assign(Request $request, $id)
{
    $user = Auth::user();
    $user->load('role');

    if (!$user->role) {
        return response()->json([
            'message' => 'User role not found.'
        ], 403);
    }

    $role = $user->role->role;

    if (!in_array($role, ['Admin', 'Manager', 'IT Support Agent'])) {
        return response()->json([
            'message' => 'Unauthorized.'
        ], 403);
    }

    $returnedStatus = Status::where('status', 'Returned')->first();
    $inProgressStatus = Status::where('status', 'In Progress')->first();

    if (!$inProgressStatus) {
        return response()->json([
            'message' => 'In Progress status not found.'
        ], 500);
    }

    $assignmentTarget = $user;

    if (in_array($role, ['Admin', 'Manager'])) {
        $request->validate([
            'assignedto' => [
                'required',
                'integer',
                'exists:users,id'
            ]
        ]);

        $agent = User::with('role')->find($request->assignedto);

        if (!$agent || !$agent->role || $agent->role->role !== 'IT Support Agent' || $agent->isbanned) {
            return response()->json([
                'message' => 'The selected user must be an active IT Support Agent.'
            ], 422);
        }

        $assignmentTarget = $agent;
    }

    $result = DB::transaction(function () use ($id, $returnedStatus, $inProgressStatus, $user, $role, $assignmentTarget) {
        $ticket = Ticket::lockForUpdate()->find($id);

        if (!$ticket) {
            return ['error' => 'Ticket not found.', 'status' => 404];
        }

        $canReassignReturnedTicket = in_array($role, ['Admin', 'Manager'])
            && $returnedStatus
            && ($role === 'Admin' || (int) $ticket->returnedto === (int) $user->id)
            && (int) $ticket->statusid === (int) $returnedStatus->id;

        $isAvailable = $ticket->assignedto === null && $ticket->returnedto === null;

        if (!$isAvailable && !$canReassignReturnedTicket) {
            return ['error' => 'This ticket is already assigned or awaiting another reviewer.', 'status' => 409];
        }

        $ticket->assignedto = $assignmentTarget->id;
        $ticket->returnedto = null;
        $ticket->statusid = $inProgressStatus->id;
        $ticket->update_date = now();
        $ticket->closed_date = null;
        $ticket->save();

        TicketHistory::create([
            'ticketid' => $ticket->id,
            'assignedby' => $user->id,
            'assignedto' => $ticket->assignedto,
            'assigneddate' => now(),
            'reason' => in_array($role, ['Admin', 'Manager'])
                ? 'Ticket assigned to IT Support Agent.'
                : 'Ticket claimed by IT Support Agent.'
        ]);

        return ['ticket' => $ticket];
    });

    if (isset($result['error'])) {
        return response()->json(['message' => $result['error']], $result['status']);
    }

    $ticket = $result['ticket'];
    $this->notifications->send(
        $this->ticketRecipients($ticket, $user->id)
            ->push($assignmentTarget)
            ->unique('id')
            ->values(),
        'ticket_assigned',
        "Ticket #{$ticket->id} was assigned to {$this->activityUserName($assignmentTarget)}.",
        $ticket,
        "/tickets/{$ticket->id}",
        "SmartDesk ticket #{$ticket->id} assigned"
    );

    return response()->json([
        'message' => in_array($role, ['Admin', 'Manager'])
            ? 'Ticket assigned successfully.'
            : 'Ticket claimed successfully.',

        'ticket' => $ticket->fresh([
            'creator',
            'assignedUser',
            'returnedTo',
            'priority',
            'status',
            'category'
        ])
    ], 200);
}

    /**
     * Return every recorded action for one ticket, newest first.
     */
    public function activity(Request $request, $id)
    {
        $ticket = Ticket::with([
            'creator.role',
            'assignedUser.role'
        ])->find($id);

        if (!$ticket) {
            return response()->json([
                'message' => 'Ticket not found.'
            ], 404);
        }

        if (!$this->canViewTicketActivity($request->user(), $ticket)) {
            return response()->json([
                'message' => 'Unauthorized.'
            ], 403);
        }

        $activities = collect([
            [
                'id' => 'ticket-created',
                'type' => 'created',
                'action' => 'Created the ticket.',
                'details' => $ticket->title,
                'date' => $this->activityDate($ticket->creation_date),
                'user' => $this->formatActivityUser($ticket->creator)
            ]
        ]);

        $logs = ActivityLog::with('user.role')
            ->where('ticketid', $ticket->id)
            ->orderBy('date')
            ->orderBy('id')
            ->get();

        foreach ($logs as $log) {
            $action = strtolower($log->action);

            $type = str_contains($action, 'closed')
                ? 'closed'
                : (str_contains($action, 'returned')
                    ? 'returned'
                    : 'updated');

            $activities->push([
                'id' => 'log-' . $log->id,
                'type' => $type,
                'action' => $log->action,
                'details' => null,
                'date' => $this->activityDate($log->date),
                'user' => $this->formatActivityUser($log->user)
            ]);
        }

        $histories = TicketHistory::with([
                'assignedBy.role',
                'assignedTo.role'
            ])
            ->where('ticketid', $ticket->id)
            ->orderBy('assigneddate')
            ->orderBy('id')
            ->get();

        foreach ($histories as $history) {
            $reason = strtolower($history->reason ?? '');
            $assignedToName = $this->activityUserName($history->assignedTo);

            if (str_contains($reason, 'returned')) {
                $type = 'returned';
                $action = 'Returned the ticket to ' . $assignedToName . '.';
            } elseif (str_contains($reason, 'claimed')) {
                $type = 'claimed';
                $action = 'Claimed the ticket.';
            } else {
                $type = 'assigned';
                $action = 'Assigned the ticket to ' . $assignedToName . '.';
            }

            $activities->push([
                'id' => 'history-' . $history->id,
                'type' => $type,
                'action' => $action,
                'details' => $history->reason,
                'date' => $this->activityDate($history->assigneddate),
                'user' => $this->formatActivityUser($history->assignedBy)
            ]);
        }

        // Seeded or older assigned tickets may predate assignment-history
        // tracking, so their current assignment is still shown.
        if ($ticket->assignedto !== null && $histories->isEmpty()) {
            $activities->push([
                'id' => 'ticket-assigned',
                'type' => 'assigned',
                'action' => 'Assigned the ticket to '
                    . $this->activityUserName($ticket->assignedUser)
                    . '.',
                'details' => 'Assignment restored from the existing ticket data.',
                'date' => $this->activityDate(
                    $ticket->update_date ?: $ticket->creation_date
                ),
                'user' => null
            ]);
        }

        $comments = TicketComment::with('user.role')
            ->where('ticketid', $ticket->id)
            ->orderBy('date')
            ->orderBy('id')
            ->get();

        foreach ($comments as $comment) {
            $isReply = $comment->parentid !== null;

            $activities->push([
                'id' => 'comment-' . $comment->id,
                'type' => $isReply ? 'reply' : 'comment',
                'action' => $isReply
                    ? 'Replied to a comment.'
                    : 'Added a comment.',
                'details' => $comment->comment,
                'date' => $this->activityDate($comment->date),
                'user' => $this->formatActivityUser($comment->user)
            ]);
        }

        // Closed tickets created before close logging was added still get a
        // closing event from their existing closed_date value.
        $hasCloseLog = $logs->contains(function (ActivityLog $log) {
            return str_contains(strtolower($log->action), 'closed');
        });

        if ($ticket->closed_date && !$hasCloseLog) {
            $activities->push([
                'id' => 'ticket-closed',
                'type' => 'closed',
                'action' => 'Closed the ticket.',
                'details' => null,
                'date' => $this->activityDate($ticket->closed_date),
                'user' => $this->formatActivityUser($ticket->assignedUser)
            ]);
        }

        $activities = $activities
            ->sort(function (array $first, array $second) {
                $dateComparison = strcmp($second['date'], $first['date']);

                return $dateComparison !== 0
                    ? $dateComparison
                    : strcmp((string) $second['id'], (string) $first['id']);
            })
            ->values();

        return response()->json([
            'ticket' => [
                'id' => $ticket->id,
                'title' => $ticket->title
            ],
            'activities' => $activities
        ]);
    }

    private function canViewTicketActivity(User $user, Ticket $ticket): bool
    {
        $user->loadMissing('role');
        $role = $user->role?->role;

        if (in_array($role, ['Admin', 'Manager'])) {
            return true;
        }

        if ($role === 'Employee') {
            return (int) $ticket->createdby === (int) $user->id;
        }

        if ($role === 'IT Support Agent') {
            return $ticket->assignedto !== null
                && (int) $ticket->assignedto === (int) $user->id;
        }

        return false;
    }

    private function ticketSnapshot(Ticket $ticket): array
    {
        return [
            'title' => $ticket->title,
            'description' => $ticket->description,
            'priorityid' => $ticket->priorityid,
            'categoryid' => $ticket->categoryid,
            'statusid' => $ticket->statusid,
            'assignedto' => $ticket->assignedto
        ];
    }

    private function recordTicketChanges(
        Ticket $ticket,
        array $before,
        User $user
    ): void {
        $labels = [
            'title' => 'title',
            'description' => 'description',
            'priorityid' => 'priority',
            'categoryid' => 'category',
            'statusid' => 'status',
            'assignedto' => 'assigned agent'
        ];

        $changed = [];

        foreach ($labels as $field => $label) {
            if ((string) ($before[$field] ?? '') !== (string) ($ticket->{$field} ?? '')) {
                $changed[] = $label;
            }
        }

        if (empty($changed)) {
            return;
        }

        if ($changed === ['status']) {
            $statusName = Status::find($ticket->statusid)?->status;
            $action = $statusName
                ? 'Changed status to ' . $statusName . '.'
                : 'Changed the ticket status.';
        } else {
            $action = 'Updated ticket: ' . implode(', ', $changed) . '.';
        }

        ActivityLog::create([
            'ticketid' => $ticket->id,
            'user_id' => $user->id,
            'action' => $action,
            'date' => now()
        ]);
    }

    private function formatActivityUser(?User $user): ?array
    {
        if (!$user) {
            return null;
        }

        $user->loadMissing('role');

        return [
            'id' => $user->id,
            'firstname' => $user->firstname,
            'username' => $user->username,
            'role' => $user->role?->role
        ];
    }

    private function ticketRecipients(Ticket $ticket, int $excludeUserId)
    {
        $ticket->loadMissing(['creator', 'assignedUser', 'returnedTo']);
        $serviceLeads = User::where('isbanned', false)
            ->whereHas('role', fn ($query) => $query->whereIn('role', ['Admin', 'Manager']))
            ->get();

        return collect([$ticket->creator, $ticket->assignedUser, $ticket->returnedTo])
            ->merge($serviceLeads)
            ->filter(fn ($recipient) => $recipient && $recipient->id !== $excludeUserId)
            ->unique('id')
            ->values();
    }

    private function activityUserName(?User $user): string
    {
        if (!$user) {
            return 'an unknown user';
        }

        return $user->firstname
            ?: ($user->username ?: 'User #' . $user->id);
    }

    private function activityDate($value): string
    {
        return Carbon::parse($value)->toISOString();
    }

}
