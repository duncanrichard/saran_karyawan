<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('management_category_assignments', function (Blueprint $table): void {
            $table->uuid('user_id');
            $table->uuid('category_id');
            $table->timestamps();
            $table->primary(['user_id', 'category_id']);
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('category_id')->references('id')->on('suggestion_categories')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('management_category_assignments');
    }
};
