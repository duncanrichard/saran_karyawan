<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        foreach ([
            ['name' => 'employee', 'description' => 'Membuat saran dan melihat respons tiket miliknya.'],
            ['name' => 'management', 'description' => 'Mengelola tiket, respons Management, kategori, dan Dashboard.'],
            ['name' => 'super_admin', 'description' => 'Mengelola seluruh akun, role, dan akses Management.'],
        ] as $role) {
            Role::updateOrCreate(['name' => $role['name'], 'guard_name' => 'web'], $role);
        }
    }
}
