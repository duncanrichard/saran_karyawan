<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('roles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name')->unique();
            $table->string('description')->nullable();
            $table->timestamps();
        });

        Schema::create('user_roles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('role_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['user_id', 'role_id']);
        });

        Schema::create('email_verification_codes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->string('code_hash');
            $table->timestamp('expires_at');
            $table->timestamp('consumed_at')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'expires_at']);
        });

        Schema::create('suggestion_categories', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name')->unique();
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('suggestions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('ticket_number')->unique();
            $table->foreignUuid('category_id')->constrained('suggestion_categories')->restrictOnDelete();
            $table->foreignUuid('submitted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignUuid('department_id')->nullable()->constrained()->nullOnDelete();
            $table->string('title');
            $table->text('details');
            $table->boolean('is_anonymous')->default(false);
            $table->string('tracking_token')->nullable()->unique();
            $table->string('status')->default('Baru');
            $table->string('priority')->nullable();
            $table->timestamp('submitted_at');
            $table->timestamp('closed_at')->nullable();
            $table->timestamps();
            $table->index(['status', 'department_id']);
        });

        Schema::create('suggestion_attachments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('suggestion_id')->constrained()->cascadeOnDelete();
            $table->string('original_name');
            $table->string('path');
            $table->string('mime_type');
            $table->unsignedBigInteger('size');
            $table->timestamps();
        });

        Schema::create('suggestion_assignments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('suggestion_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('assignee_id')->constrained('users')->restrictOnDelete();
            $table->foreignUuid('assigned_by')->constrained('users')->restrictOnDelete();
            $table->timestamp('assigned_at');
            $table->timestamp('completed_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('suggestion_messages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('suggestion_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('sender_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('body');
            $table->string('sender_type');
            $table->boolean('is_internal')->default(false);
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
        });

        Schema::create('suggestion_status_histories', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('suggestion_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('changed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('from_status')->nullable();
            $table->string('to_status');
            $table->text('note')->nullable();
            $table->timestamps();
        });

        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('suggestion_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('type');
            $table->string('title');
            $table->text('body');
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('suggestion_status_histories');
        Schema::dropIfExists('suggestion_messages');
        Schema::dropIfExists('suggestion_assignments');
        Schema::dropIfExists('suggestion_attachments');
        Schema::dropIfExists('suggestions');
        Schema::dropIfExists('suggestion_categories');
        Schema::dropIfExists('email_verification_codes');
        Schema::dropIfExists('user_roles');
        Schema::dropIfExists('roles');
    }
};
