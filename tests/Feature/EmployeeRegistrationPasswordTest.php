<?php

namespace Tests\Feature;

use App\Mail\EmployeeVerificationCodeMail;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
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
}
