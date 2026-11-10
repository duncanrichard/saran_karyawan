<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class SuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::updateOrCreate(
            ['username' => env('SUPER_ADMIN_USERNAME', 'superadmin')],
            [
                'first_name' => env('SUPER_ADMIN_FIRST_NAME', 'Super'),
                'last_name' => env('SUPER_ADMIN_LAST_NAME', 'Admin'),
                'email' => env('SUPER_ADMIN_EMAIL', 'superadmin@saran-karyawan.local'),
                'password' => env('SUPER_ADMIN_PASSWORD', 'SuperAdmin!2026'),
                'role' => 'super_admin',
                'is_active' => true,
                'email_verified_at' => now(),
            ],
        );
        $user->syncRoles(['super_admin']);
    }
}
