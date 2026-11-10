<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class ManagementAuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'username' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);
        $user = User::query()->where('username', $data['username'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password) || ! $user->hasAnyRole(['management', 'super_admin'])) {
            throw ValidationException::withMessages(['username' => 'Akun management atau password tidak sesuai.']);
        }

        if (! $user->is_active) {
            throw ValidationException::withMessages(['username' => 'Akun management ini tidak aktif.']);
        }

        Auth::login($user, false);
        $request->session()->regenerate();

        return response()->json(['user' => $this->userData($user)]);
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Anda telah keluar dari Management.']);
    }

    public function user(Request $request): JsonResponse
    {
        return response()->json(['user' => $this->userData($request->user())]);
    }

    private function userData(User $user): array
    {
        return $user->only(['id', 'first_name', 'last_name', 'username', 'email', 'role']);
    }
}
