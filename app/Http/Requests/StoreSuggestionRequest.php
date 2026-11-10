<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSuggestionRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        if (! is_string($this->input('is_anonymous'))) {
            return;
        }

        $value = strtolower($this->input('is_anonymous'));

        if (in_array($value, ['true', 'false'], true)) {
            $this->merge(['is_anonymous' => $value === 'true']);
        }
    }

    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'category_id' => ['required', 'uuid', 'exists:suggestion_categories,id'],
            'title' => ['required', 'string', 'max:120'],
            'details' => ['required', 'string', 'max:2000'],
            'is_anonymous' => ['required', 'boolean'],
            'attachment' => ['nullable', 'file', 'max:5120', 'mimes:pdf,doc,docx,png,jpg,jpeg'],
        ];
    }
}
