<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('suggestions', function (Blueprint $table) {
            $table->foreignUuid('created_by')
                ->nullable()
                ->after('submitted_by')
                ->constrained('users')
                ->nullOnDelete();
        });

        Schema::table('suggestion_attachments', function (Blueprint $table) {
            $table->foreignUuid('created_by')
                ->nullable()
                ->after('suggestion_id')
                ->constrained('users')
                ->nullOnDelete();
        });

        DB::table('suggestions')
            ->whereNull('created_by')
            ->update(['created_by' => DB::raw('submitted_by')]);

        $now = now();

        foreach ([
            ['Lingkungan kerja', 'Usulan terkait kenyamanan, keselamatan, atau suasana kerja.'],
            ['Fasilitas kantor', 'Usulan terkait fasilitas dan perlengkapan kantor.'],
            ['Proses kerja', 'Usulan penyederhanaan atau perbaikan alur kerja.'],
            ['Teknologi', 'Usulan terkait aplikasi, perangkat, atau sistem informasi.'],
            ['Kesejahteraan', 'Usulan terkait kesejahteraan dan pengalaman karyawan.'],
            ['Lainnya', 'Saran yang belum sesuai kategori lain.'],
        ] as [$name, $description]) {
            DB::table('suggestion_categories')->insertOrIgnore([
                'id' => (string) Str::uuid7(),
                'name' => $name,
                'description' => $description,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    public function down(): void
    {
        Schema::table('suggestion_attachments', function (Blueprint $table) {
            $table->dropConstrainedForeignId('created_by');
        });

        Schema::table('suggestions', function (Blueprint $table) {
            $table->dropConstrainedForeignId('created_by');
        });
    }
};
