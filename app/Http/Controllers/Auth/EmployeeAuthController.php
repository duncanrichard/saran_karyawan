<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\ForgotPasswordRequest;
use App\Http\Requests\LoginEmployeeRequest;
use App\Http\Requests\RegisterEmployeeRequest;
use App\Http\Requests\ResetEmployeePasswordRequest;
use App\Http\Requests\VerifyEmailOtpRequest;
use App\Mail\EmployeeVerificationCodeMail;
use App\Models\User;
use App\Models\Role;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class EmployeeAuthController extends Controller
{
    public function register(RegisterEmployeeRequest $request): JsonResponse
    {
        $data = $request->validated();
        $code = (string) random_int(100000, 999999);

        $user = DB::transaction(function () use ($code, $data): User {
            $user = User::create($data);
            Role::firstOrCreate(['name' => 'employee', 'guard_name' => 'web']);
            $user->syncRoles(['employee']);

            DB::table('email_verification_codes')->insert([
                'id' => (string) Str::uuid7(),
                'user_id' => $user->id,
                'code_hash' => Hash::make($code),
                'expires_at' => now()->addMinutes((int) config('auth.otp_expiration_minutes')),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            return $user;
        });

        Mail::to($user->email)->send(new EmployeeVerificationCodeMail($code, $user->first_name));

        return response()->json([
            'message' => 'Pendaftaran berhasil. Periksa email perusahaan Anda untuk kode OTP.',
            'email' => $user->email,
        ], 201);
    }

    public function verifyEmail(VerifyEmailOtpRequest $request): JsonResponse
    {
        $data = $request->validated();
        $user = User::query()->where('email', $data['email'])->firstOrFail();
        $verificationCode = DB::table('email_verification_codes')
            ->where('user_id', $user->id)
            ->whereNull('consumed_at')
            ->where('expires_at', '>', now())
            ->latest('created_at')
            ->first();

        if (! $verificationCode || ! Hash::check($data['code'], $verificationCode->code_hash)) {
            throw ValidationException::withMessages([
                'code' => 'Kode OTP tidak valid atau sudah kedaluwarsa.',
            ]);
        }

        DB::transaction(function () use ($user, $verificationCode): void {
            $user->forceFill(['email_verified_at' => now()])->save();

            DB::table('email_verification_codes')
                ->where('id', $verificationCode->id)
                ->update(['consumed_at' => now(), 'updated_at' => now()]);
        });

        return response()->json([
            'message' => 'Email perusahaan berhasil diverifikasi. Silakan masuk menggunakan username dan password.',
        ]);
    }

    public function resendVerificationOtp(Request $request): JsonResponse
    {
        $data = $request->validate(['email' => ['required', 'email']]);
        $user = User::query()->where('email', $data['email'])->first();

        if (! $user) {
            throw ValidationException::withMessages(['email' => 'Akun dengan email tersebut tidak ditemukan.']);
        }

        if ($user->email_verified_at) {
            throw ValidationException::withMessages(['email' => 'Email ini sudah diverifikasi. Silakan masuk.']);
        }

        $code = (string) random_int(100000, 999999);

        DB::transaction(function () use ($code, $user): void {
            DB::table('email_verification_codes')
                ->where('user_id', $user->id)
                ->whereNull('consumed_at')
                ->update(['consumed_at' => now(), 'updated_at' => now()]);

            DB::table('email_verification_codes')->insert([
                'id' => (string) Str::uuid7(),
                'user_id' => $user->id,
                'code_hash' => Hash::make($code),
                'expires_at' => now()->addMinutes((int) config('auth.otp_expiration_minutes')),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        });

        Mail::to($user->email)->send(new EmployeeVerificationCodeMail($code, $user->first_name));

        return response()->json([
            'message' => 'OTP baru telah dikirim. Gunakan kode terbaru dari email Anda.',
        ]);
    }

    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        Password::sendResetLink($request->safe()->only('email'));

        return response()->json([
            'message' => 'Jika email tersebut terdaftar, tautan untuk mengatur ulang password telah dikirim.',
        ]);
    }

    public function resetPassword(ResetEmployeePasswordRequest $request): JsonResponse
    {
        $data = $request->validated();
        $status = Password::reset($data, function (User $user, string $password): void {
            $user->forceFill([
                'password' => Hash::make($password),
                'remember_token' => Str::random(60),
            ])->save();

            event(new PasswordReset($user));
        });

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages([
                'email' => 'Tautan reset password tidak valid atau sudah kedaluwarsa.',
            ]);
        }

        return response()->json([
            'message' => 'Password berhasil diperbarui. Silakan masuk dengan password baru Anda.',
        ]);
    }

    public function login(LoginEmployeeRequest $request): JsonResponse
    {
        $data = $request->validated();
        $user = User::query()->where('username', $data['username'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'username' => 'Username atau password tidak sesuai.',
            ]);
        }

        if (! $user->is_active) {
            throw ValidationException::withMessages([
                'username' => 'Akun ini tidak aktif.',
            ]);
        }

        if (! $user->email_verified_at) {
            throw ValidationException::withMessages([
                'username' => 'Verifikasi email perusahaan terlebih dahulu.',
            ]);
        }

        if (! $user->hasRole('employee')) {
            throw ValidationException::withMessages([
                'username' => 'Akun ini tidak memiliki akses Karyawan. Gunakan login Management.',
            ]);
        }

        Auth::login($user, (bool) ($data['remember'] ?? false));
        $request->session()->regenerate();

        return response()->json([
            'message' => 'Anda berhasil masuk.',
            'user' => $user->only(['id', 'first_name', 'last_name', 'username', 'email', 'role']),
            'redirect_to' => null,
        ]);
    }

    public function logout(): JsonResponse
    {
        Auth::logout();
        request()->session()->invalidate();
        request()->session()->regenerateToken();

        return response()->json(['message' => 'Anda berhasil keluar.']);
    }

    public function user(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $request->user()->only(['id', 'first_name', 'last_name', 'username', 'email', 'role']),
        ]);
    }
}
