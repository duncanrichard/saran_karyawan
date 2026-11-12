<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;
use Spatie\Permission\PermissionRegistrar;

class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $all = ['ticket.view', 'ticket.reply', 'ticket.update', 'ticket.assign', 'category.manage', 'account.manage', 'role.manage'];
        foreach ($all as $name) Permission::findOrCreate($name, 'web');

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        Role::findByName('management')->syncPermissions(['ticket.view', 'ticket.reply', 'ticket.update', 'ticket.assign']);
        Role::findByName('super_admin')->syncPermissions($all);
    }
}
