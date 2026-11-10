<?php

use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('roles', function (Blueprint $table): void { $table->string('guard_name')->default('web'); $table->dropUnique(['name']); $table->unique(['name', 'guard_name']); });
        Schema::create('permissions', function (Blueprint $table): void { $table->uuid('id')->primary(); $table->string('name'); $table->string('guard_name'); $table->timestamps(); $table->unique(['name', 'guard_name']); });
        Schema::create('model_has_roles', function (Blueprint $table): void { $table->foreignUuid('role_id')->constrained('roles')->cascadeOnDelete(); $table->uuid('model_id'); $table->string('model_type'); $table->primary(['role_id', 'model_id', 'model_type']); });
        Schema::create('model_has_permissions', function (Blueprint $table): void { $table->foreignUuid('permission_id')->constrained('permissions')->cascadeOnDelete(); $table->uuid('model_id'); $table->string('model_type'); $table->primary(['permission_id', 'model_id', 'model_type']); });
        Schema::create('role_has_permissions', function (Blueprint $table): void { $table->foreignUuid('permission_id')->constrained('permissions')->cascadeOnDelete(); $table->foreignUuid('role_id')->constrained('roles')->cascadeOnDelete(); $table->primary(['permission_id', 'role_id']); });
        $roles = DB::table('roles')->pluck('id', 'name');
        foreach (DB::table('users')->select('id', 'role')->get() as $user) if (isset($roles[$user->role])) DB::table('model_has_roles')->insertOrIgnore(['role_id' => $roles[$user->role], 'model_id' => $user->id, 'model_type' => User::class]);
        foreach (DB::table('user_roles')->get() as $assignment) DB::table('model_has_roles')->insertOrIgnore(['role_id' => $assignment->role_id, 'model_id' => $assignment->user_id, 'model_type' => User::class]);
        Schema::dropIfExists('user_roles');
    }

    public function down(): void
    {
        Schema::dropIfExists('role_has_permissions'); Schema::dropIfExists('model_has_permissions'); Schema::dropIfExists('model_has_roles'); Schema::dropIfExists('permissions');
        Schema::table('roles', function (Blueprint $table): void { $table->dropUnique(['name', 'guard_name']); $table->dropColumn('guard_name'); $table->unique('name'); });
    }
};
