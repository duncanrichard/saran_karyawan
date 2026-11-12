<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class SuggestionCategory extends Model
{
    use HasUuids;

    protected $fillable = ['name', 'description', 'is_active'];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    public function handlers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'management_category_assignments', 'category_id', 'user_id')->withTimestamps();
    }
}
