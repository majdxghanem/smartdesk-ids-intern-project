<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $notifications = Notification::query()
            ->where('userid', $request->user()->id)
            ->with('ticket:id,title')
            ->orderByDesc('date')
            ->paginate(min(max((int) $request->query('per_page', 15), 1), 50));

        return response()->json($notifications);
    }

    public function unreadCount(Request $request)
    {
        return response()->json([
            'count' => Notification::where('userid', $request->user()->id)
                ->whereNull('read_at')
                ->count(),
        ]);
    }

    public function markRead(Request $request, int $id)
    {
        $notification = Notification::where('userid', $request->user()->id)->findOrFail($id);
        $notification->update(['read_at' => $notification->read_at ?? now()]);

        return response()->json(['message' => 'Notification marked as read.']);
    }

    public function markAllRead(Request $request)
    {
        Notification::where('userid', $request->user()->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json(['message' => 'All notifications marked as read.']);
    }
}
