<?php

namespace Tests\Feature;

use App\Mail\EmployeeVerificationCodeMail;
use App\Models\User;
use App\Models\Role;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Password;
use Tests\TestCase;

class EmployeeRegistrationPasswordTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_requires_a_password_with_all_security_requirements(): void
    {
        $this->postJson('/auth/register', [
            'first_name' => 'Ayu',
            'last_name' => 'Putri',
            'username' => 'ayu.putri',
            'email' => 'ayu@example.com',
            'password' => 'onlylowercase1',
            'password_confirmation' => 'onlylowercase1',
        ])->assertUnprocessable()->assertJsonValidationErrors('password');
    }

    public function test_registration_sends_a_verification_email(): void
    {
        Mail::fake();

        $this->postJson('/auth/register', [
            'first_name' => 'Ayu',
            'last_name' => 'Putri',
            'username' => 'ayu_putri',
            'email' => 'ayu@example.com',
            'password' => 'PasswordAman!123',
            'password_confirmation' => 'PasswordAman!123',
        ])->assertCreated();

        Mail::assertSent(EmployeeVerificationCodeMail::class, function (EmployeeVerificationCodeMail $mail): bool {
            return $mail->hasTo('ayu@example.com')
                && strlen($mail->code) === 6;
        });
    }

    public function test_unverified_employee_can_resend_a_new_verification_otp(): void
    {
        Mail::fake();

        $this->postJson('/auth/register', [
            'first_name' => 'Ayu',
            'last_name' => 'Putri',
            'username' => 'ayu_putri',
            'email' => 'ayu@example.com',
            'password' => 'PasswordAman!123',
            'password_confirmation' => 'PasswordAman!123',
        ])->assertCreated();

        $user = User::query()->where('email', 'ayu@example.com')->firstOrFail();
        $oldCode = DB::table('email_verification_codes')->where('user_id', $user->id)->first();

        $this->postJson('/auth/resend-verification-otp', ['email' => $user->email])
            ->assertOk()
            ->assertJsonPath('message', 'OTP baru telah dikirim. Gunakan kode terbaru dari email Anda.');

        $this->assertDatabaseMissing('email_verification_codes', ['id' => $oldCode->id, 'consumed_at' => null]);
        $this->assertDatabaseCount('email_verification_codes', 2);
        Mail::assertSent(EmployeeVerificationCodeMail::class, 2);
    }

    public function test_employee_can_request_a_password_reset_link(): void
    {
        $user = User::factory()->create(['email' => 'ayu@example.com']);

        $this->postJson('/auth/forgot-password', ['email' => $user->email])
            ->assertOk()
            ->assertJsonPath('message', 'Jika email tersebut terdaftar, tautan untuk mengatur ulang password telah dikirim.');

        $this->assertDatabaseHas('password_reset_tokens', ['email' => $user->email]);
    }

    public function test_employee_can_reset_password_with_a_valid_link_token(): void
    {
        $user = User::factory()->create(['email' => 'ayu@example.com']);
        $token = Password::createToken($user);

        $this->postJson('/auth/reset-password', [
            'email' => $user->email,
            'token' => $token,
            'password' => 'PasswordBaru!123',
            'password_confirmation' => 'PasswordBaru!123',
        ])->assertOk();

        $this->assertTrue(Hash::check('PasswordBaru!123', $user->fresh()->password));
    }

    public function test_password_reset_link_opens_the_new_password_page(): void
    {
        $this->get('/reset-password/token-contoh?email=ayu%40example.com')
            ->assertOk()
            ->assertSee('employee-portal');
    }

    public function test_account_with_employee_and_management_access_stays_in_employee_portal_after_employee_login(): void
    {
        $employee = Role::firstOrCreate(['name' => 'employee', 'guard_name' => 'web']);
        $management = Role::firstOrCreate(['name' => 'management', 'guard_name' => 'web']);
        $user = User::factory()->create([
            'username' => 'akun_gabungan',
            'password' => 'PasswordAman!123',
            'email_verified_at' => now(),
        ]);
        $user->syncRoles([$employee, $management]);

        $this->postJson('/auth/login', [
            'username' => 'akun_gabungan',
            'password' => 'PasswordAman!123',
        ])->assertOk()->assertJsonPath('redirect_to', null);
    }
}
