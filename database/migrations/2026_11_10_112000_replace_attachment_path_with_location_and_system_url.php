<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('suggestion_attachments', function (Blueprint $table) {
            $table->renameColumn('path', 'location');
            $table->string('url_system')->nullable()->unique();
        });

        DB::table('suggestion_attachments')
            ->select('id')
            ->orderBy('id')
            ->each(function (object $attachment): void {
                DB::table('suggestion_attachments')
                    ->where('id', $attachment->id)
                    ->update([
                        'url_system' => "/suggestions/attachments/{$attachment->id}/open",
                        'updated_at' => now(),
                    ]);
            });
    }

    public function down(): void
    {
        Schema::table('suggestion_attachments', function (Blueprint $table) {
            $table->dropUnique(['url_system']);
            $table->dropColumn('url_system');
            $table->renameColumn('location', 'path');
        });
    }
};
