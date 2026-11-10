<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ClaimAnonymousSuggestionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'ticket_number' => ['required', 'string', 'max:50'],
            'tracking_token' => ['required', 'string', 'size:48'],
        ];
    }
}
