<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use Carbon\Carbon;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function months()
    {
        $firstTicketDate = Ticket::withTrashed()->min('creation_date');
        $cursor = $firstTicketDate ? Carbon::parse($firstTicketDate)->startOfMonth() : now()->startOfMonth();
        $last = now()->startOfMonth();
        $months = [];

        while ($cursor->lte($last)) {
            $months[] = [
                'value' => $cursor->format('Y-m'),
                'label' => $cursor->format('F Y'),
            ];
            $cursor->addMonth();
        }

        return response()->json(['months' => array_reverse($months)]);
    }

    public function monthly(Request $request)
    {
        $validated = $request->validate([
            'month' => ['required', 'date_format:Y-m'],
        ]);
        $start = Carbon::createFromFormat('Y-m', $validated['month'])->startOfMonth();
        $end = $start->copy()->endOfMonth();

        $createdTickets = Ticket::withTrashed()
            ->with(['category:id,category', 'priority:id,priority', 'status:id,status', 'assignedUser:id,firstname,username'])
            ->whereBetween('creation_date', [$start, $end])
            ->orderBy('creation_date')
            ->get();
        $resolvedTickets = $createdTickets->filter(fn (Ticket $ticket) => $ticket->closed_date !== null);
        $closedDuringMonth = Ticket::withTrashed()->whereBetween('closed_date', [$start, $end])->count();
        $backlogAtMonthEnd = Ticket::withTrashed()
            ->where('creation_date', '<=', $end)
            ->where(function ($query) use ($end) {
                $query->whereNull('closed_date')->orWhere('closed_date', '>', $end);
            })
            ->count();
        $averageResolutionHours = $resolvedTickets->isEmpty()
            ? null
            : round($resolvedTickets->avg(fn (Ticket $ticket) => Carbon::parse($ticket->creation_date)->diffInMinutes(Carbon::parse($ticket->closed_date)) / 60), 1);
        $closeRate = $createdTickets->isEmpty() ? 0 : round(($resolvedTickets->count() / $createdTickets->count()) * 100, 1);

        $statusBreakdown = $this->breakdown($createdTickets, fn (Ticket $ticket) => $ticket->status?->status ?: 'Unknown');
        $categoryBreakdown = $this->breakdown($createdTickets, fn (Ticket $ticket) => $ticket->category?->category ?: 'Uncategorized');
        $priorityBreakdown = $this->breakdown($createdTickets, fn (Ticket $ticket) => $ticket->priority?->priority ?: 'Unknown');
        $agentBreakdown = $this->breakdown($createdTickets, function (Ticket $ticket) {
            if ($ticket->returnedto) return 'Review queue';
            return $ticket->assignedUser?->firstname ?: $ticket->assignedUser?->username ?: 'Unassigned';
        });

        $createdByDay = $createdTickets->groupBy(fn (Ticket $ticket) => Carbon::parse($ticket->creation_date)->format('Y-m-d'))->map->count();
        $closedByDay = Ticket::withTrashed()
            ->whereBetween('closed_date', [$start, $end])
            ->get(['closed_date'])
            ->groupBy(fn (Ticket $ticket) => Carbon::parse($ticket->closed_date)->format('Y-m-d'))
            ->map->count();
        $dailyVolume = [];
        $day = $start->copy();
        while ($day->lte($end)) {
            $key = $day->format('Y-m-d');
            $dailyVolume[] = [
                'date' => $key,
                'day' => $day->format('j'),
                'created' => (int) ($createdByDay[$key] ?? 0),
                'closed' => (int) ($closedByDay[$key] ?? 0),
            ];
            $day->addDay();
        }

        $busiestCategory = collect($categoryBreakdown)->sortByDesc('count')->first();
        $busiestDay = collect($dailyVolume)->sortByDesc('created')->first();
        $highPriorityCount = $createdTickets->filter(fn (Ticket $ticket) => in_array(strtolower((string) $ticket->priority?->priority), ['high', 'critical'], true))->count();
        $importantPoints = [
            $createdTickets->count() === 0
                ? 'No new tickets were created during this month.'
                : "{$createdTickets->count()} tickets were created and {$closedDuringMonth} tickets were closed during the month.",
            $busiestCategory && $busiestCategory['count'] > 0
                ? "{$busiestCategory['label']} was the leading request category with {$busiestCategory['count']} tickets."
                : 'No category trend was available for this month.',
            $busiestDay && $busiestDay['created'] > 0
                ? Carbon::parse($busiestDay['date'])->format('F j').' had the highest intake with '.$busiestDay['created'].' tickets.'
                : 'There was no measurable peak intake day.',
            $averageResolutionHours !== null
                ? "Average resolution time was {$averageResolutionHours} hours, with a {$closeRate}% resolution rate for tickets created this month."
                : 'No tickets from this month have a completed resolution time yet.',
            "Month-end backlog was {$backlogAtMonthEnd} tickets; {$highPriorityCount} new tickets were high or critical priority.",
        ];

        return response()->json([
            'month' => $validated['month'],
            'label' => $start->format('F Y'),
            'period' => ['start' => $start->toDateString(), 'end' => $end->toDateString()],
            'generated_at' => now()->toISOString(),
            'metrics' => [
                'created' => $createdTickets->count(),
                'resolved_from_cohort' => $resolvedTickets->count(),
                'closed_during_month' => $closedDuringMonth,
                'close_rate' => $closeRate,
                'average_resolution_hours' => $averageResolutionHours,
                'backlog_at_month_end' => $backlogAtMonthEnd,
                'unassigned' => $createdTickets->whereNull('assignedto')->whereNull('returnedto')->count(),
                'high_priority' => $highPriorityCount,
            ],
            'important_points' => $importantPoints,
            'daily_volume' => $dailyVolume,
            'breakdowns' => [
                'status' => $statusBreakdown,
                'category' => $categoryBreakdown,
                'priority' => $priorityBreakdown,
                'agent' => $agentBreakdown,
            ],
            'tickets' => $createdTickets->map(fn (Ticket $ticket) => [
                'id' => $ticket->id,
                'title' => $ticket->title,
                'category' => $ticket->category?->category ?: 'Uncategorized',
                'priority' => $ticket->priority?->priority ?: 'Unknown',
                'status' => $ticket->status?->status ?: 'Unknown',
                'assigned_to' => $ticket->returnedto
                    ? 'Review queue'
                    : ($ticket->assignedUser?->firstname ?: $ticket->assignedUser?->username ?: 'Unassigned'),
                'created_at' => Carbon::parse($ticket->creation_date)->toISOString(),
                'closed_at' => $ticket->closed_date ? Carbon::parse($ticket->closed_date)->toISOString() : null,
                'archived' => $ticket->trashed(),
            ])->values(),
        ]);
    }

    private function breakdown($tickets, callable $label): array
    {
        return $tickets
            ->groupBy($label)
            ->map(fn ($group, $name) => ['label' => (string) $name, 'count' => $group->count()])
            ->sortByDesc('count')
            ->values()
            ->all();
    }
}
