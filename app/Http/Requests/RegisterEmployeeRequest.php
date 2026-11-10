<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class RegisterEmployeeRequest extends FormRequest
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
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'username' => ['required', 'string', 'alpha_dash', 'min:3', 'max:50', 'unique:users,username'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => [
                'required',
                'string',
                'confirmed',
                Password::min(12)->mixedCase()->numbers()->symbols(),
            ],
        ];
    }

    /**
     * Get custom validation messages for employee registration.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'username.alpha_dash' => 'Username hanya boleh berisi huruf, angka, tanda hubung (-), dan garis bawah (_).',
            'username.min' => 'Username minimal terdiri dari :min karakter.',
            'username.unique' => 'Username tersebut sudah digunakan.',
            'email.email' => 'Masukkan alamat email perusahaan yang valid.',
            'email.unique' => 'Email perusahaan tersebut sudah terdaftar.',
            'password.confirmed' => 'Konfirmasi password harus sama dengan password.',
        ];
    }
}
