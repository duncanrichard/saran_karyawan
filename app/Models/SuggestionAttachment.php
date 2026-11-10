<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SuggestionAttachment extends Model
{
    use HasUuids;

    protected $fillable = [
        'suggestion_id',
        'created_by',
        'original_name',
        'location',
        'url_system',
        'mime_type',
        'size',
    ];

    public function suggestion(): BelongsTo
    {
        return $this->belongsTo(Suggestion::class);
    }
}
