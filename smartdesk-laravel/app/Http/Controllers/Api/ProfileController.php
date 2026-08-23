<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Illuminate\Validation\Rules\Password;

class ProfileController extends Controller
{
    public function show(Request $request)
    {
        return response()->json([
            'user' => $this->profileData($request->user()->load('role')),
        ]);
    }

    public function update(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'firstname' => ['sometimes', 'required', 'string', 'max:255'],
            'email' => [
                'sometimes',
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($user->id),
            ],
            'current_password' => ['nullable', 'string'],
            'password' => ['sometimes', 'required', 'confirmed', Password::min(8)->mixedCase()->numbers()],
        ]);

        $emailChanged = array_key_exists('email', $validated)
            && $validated['email'] !== $user->email;
        $passwordChanged = array_key_exists('password', $validated);

        if ($emailChanged || $passwordChanged) {
            if (!$request->filled('current_password')) {
                throw ValidationException::withMessages([
                    'current_password' => 'Your current password is required to change your email or password.',
                ]);
            }

            if (!Hash::check($request->current_password, $user->password)) {
                throw ValidationException::withMessages([
                    'current_password' => 'The current password is incorrect.',
                ]);
            }
        }

        if (array_key_exists('firstname', $validated)) {
            $user->firstname = $validated['firstname'];
        }

        if ($emailChanged) {
            $user->email = $validated['email'];
        }

        if ($passwordChanged) {
            $user->password = Hash::make($validated['password']);
        }

        $user->save();

        if ($passwordChanged) {
            $currentTokenId = $user->currentAccessToken()?->id;
            $user->tokens()->when($currentTokenId, fn ($query) => $query->where('id', '!=', $currentTokenId))->delete();
        }

        return response()->json([
            'message' => 'Profile updated successfully.',
            'user' => $this->profileData($user->load('role')),
        ]);
    }

    private function profileData($user): array
    {
        return [
            'id' => $user->id,
            'firstname' => $user->firstname,
            'username' => $user->username,
            'email' => $user->email,
            'role' => $user->role?->role,
            'creationdate' => $user->creationdate,
            'isbanned' => (bool) $user->isbanned,
        ];
    }
}
