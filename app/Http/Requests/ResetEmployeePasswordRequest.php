<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class ResetEmployeePasswordRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'token' => ['required', 'string'],
            'email' => ['required', 'string', 'email', 'max:255'],
            'password' => [
                'required',
                'string',
                'confirmed',
                Password::min(12)->mixedCase()->numbers()->symbols(),
            ],
        ];
    }

    /**
     * Get custom validation messages for password reset.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'password.confirmed' => 'Konfirmasi password harus sama dengan password baru.',
        ];
    }
}
