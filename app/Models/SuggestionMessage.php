<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SuggestionMessage extends Model
{
    use HasUuids;

    protected $fillable = ['suggestion_id', 'sender_id', 'body', 'sender_type', 'is_internal', 'read_at'];

    protected function casts(): array
    {
        return ['is_internal' => 'boolean', 'read_at' => 'datetime'];
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }
}
