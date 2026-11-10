<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;

class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        $all = ['ticket.view', 'ticket.reply', 'ticket.update', 'ticket.assign', 'category.manage', 'account.manage', 'role.manage'];
        foreach ($all as $name) Permission::findOrCreate($name, 'web');
        Role::findByName('management')->syncPermissions(['ticket.view', 'ticket.reply', 'ticket.update', 'ticket.assign', 'category.manage']);
        Role::findByName('super_admin')->syncPermissions($all);
    }
}
