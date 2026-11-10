<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('suggestions', function (Blueprint $table): void { $table->timestamp('sla_due_at')->nullable()->index(); });
        $private = storage_path('app/private/suggestion-attachments'); File::ensureDirectoryExists($private);
        DB::table('suggestion_attachments')->select('id', 'location')->orderBy('id')->each(function (object $attachment) use ($private): void {
            $source = public_path($attachment->location); $filename = basename($attachment->location);
            if (File::exists($source)) { File::move($source, "{$private}/{$filename}"); }
            DB::table('suggestion_attachments')->where('id', $attachment->id)->update(['location' => "suggestion-attachments/{$filename}", 'url_system' => "/suggestions/attachments/{$attachment->id}/open"]);
        });
    }
    public function down(): void { Schema::table('suggestions', function (Blueprint $table): void { $table->dropIndex(['sla_due_at']); $table->dropColumn('sla_due_at'); }); }
};
