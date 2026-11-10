<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        $directory = public_path('uploads/stores');
        File::ensureDirectoryExists($directory);

        DB::table('suggestion_attachments')
            ->select('id', 'location', 'original_name')
            ->orderBy('id')
            ->each(function (object $attachment) use ($directory): void {
                $extension = pathinfo($attachment->original_name, PATHINFO_EXTENSION) ?: pathinfo($attachment->location, PATHINFO_EXTENSION);
                $filename = (string) Str::uuid7().($extension ? ".{$extension}" : '');
                $location = "uploads/stores/{$filename}";
                $legacyFile = storage_path("app/private/{$attachment->location}");
                $targetFile = "{$directory}/{$filename}";

                if (File::exists($legacyFile)) {
                    File::copy($legacyFile, $targetFile);
                }

                DB::table('suggestion_attachments')
                    ->where('id', $attachment->id)
                    ->update([
                        'location' => $location,
                        'url_system' => url($location),
                        'updated_at' => now(),
                    ]);
            });
    }

    public function down(): void
    {
        // Public files are intentionally retained to avoid deleting user uploads on rollback.
    }
};
