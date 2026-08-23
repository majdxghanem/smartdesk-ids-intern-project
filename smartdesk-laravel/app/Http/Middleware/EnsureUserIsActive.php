<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsActive
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user()?->isbanned) {
            $request->user()->currentAccessToken()?->delete();

            return response()->json([
                'message' => 'Your account is disabled. Please contact an administrator.',
            ], 403);
        }

        return $next($request);
    }
}
