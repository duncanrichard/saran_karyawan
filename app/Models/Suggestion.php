<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Suggestion extends Model
{
    use HasUuids;

    protected $fillable = [
        'ticket_number',
        'category_id',
        'submitted_by',
        'created_by',
        'department_id',
        'title',
        'details',
        'is_anonymous',
        'tracking_token',
        'status',
        'priority',
        'submitted_at',
        'closed_at',
    ];

    protected function casts(): array
    {
        return [
            'is_anonymous' => 'boolean',
            'submitted_at' => 'datetime',
            'closed_at' => 'datetime',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(SuggestionCategory::class, 'category_id');
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(SuggestionAttachment::class);
    }

    public function submittedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }

    public function messages(): HasMany
    {
        return $this->hasMany(SuggestionMessage::class)->orderBy('created_at');
    }
}
