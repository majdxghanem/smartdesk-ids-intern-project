<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Priority;
use Illuminate\Http\Request;

class PriorityController extends Controller
{
    public function index()
    {
        return response()->json(
            Priority::orderBy('id')->get()
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate(['priority' => ['required', 'string', 'max:100', 'unique:priorities,priority']]);
        return response()->json(['message' => 'Priority created successfully.', 'priority' => Priority::create(['priority' => trim($validated['priority'])])], 201);
    }

    public function update(Request $request, int $id)
    {
        $priority = Priority::findOrFail($id);
        $validated = $request->validate(['priority' => ['required', 'string', 'max:100', 'unique:priorities,priority,'.$id]]);
        $priority->update(['priority' => trim($validated['priority'])]);
        return response()->json(['message' => 'Priority updated successfully.', 'priority' => $priority]);
    }

    public function destroy(int $id)
    {
        $priority = Priority::findOrFail($id);
        if ($priority->tickets()->withTrashed()->exists()) {
            return response()->json(['message' => 'This priority is used by tickets and cannot be removed. Rename it instead.'], 409);
        }
        $priority->delete();
        return response()->json(['message' => 'Priority removed successfully.']);
    }
}
