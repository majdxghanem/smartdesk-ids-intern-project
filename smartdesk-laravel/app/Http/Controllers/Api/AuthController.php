<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required'
        ]);

        $user = User::with('role')
            ->where('email', $request->email)
            ->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Invalid email or password'
            ], 401);
        }

        if ($user->isbanned) {
            return response()->json([
                'message' => 'Your account is disabled. Please contact an administrator.'
            ], 403);
        }

        $token = $user->createToken('SmartDesk')->plainTextToken;

        return response()->json([
            'message' => 'Login successful',

            'token' => $token,

            'user' => [
                'id' => $user->id,
                'firstname' => $user->firstname,
                'username' => $user->username,
                'email' => $user->email,
                'role' => $user->role->role
            ]
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully'
        ]);
    }

    public function me(Request $request)
    {
        return response()->json($request->user()->load('role'));
    }
}
