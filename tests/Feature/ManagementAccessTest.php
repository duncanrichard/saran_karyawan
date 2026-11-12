<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\SuggestionCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ManagementAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_is_redirected_to_the_employee_portal_instead_of_a_missing_login_route(): void
    {
        $this->get('/management')->assertRedirect('/');
        $this->get('/management/login')->assertOk();
    }

    public function test_employee_cannot_open_the_management_page_by_direct_url(): void
    {
        Role::firstOrCreate(['name' => 'employee', 'guard_name' => 'web']);
        $employee = User::factory()->create();
        $employee->assignRole('employee');

        $this->actingAs($employee)->get('/management')->assertRedirect('/');

        $this->actingAs($employee)
            ->getJson('/management/dashboard')
            ->assertForbidden();
    }

    public function test_management_role_can_open_the_management_page(): void
    {
        Role::firstOrCreate(['name' => 'management', 'guard_name' => 'web']);
        $manager = User::factory()->create();
        $manager->assignRole('management');

        $this->actingAs($manager)->get('/management')->assertOk();
    }

    public function test_management_cannot_manage_categories(): void
    {
        Role::firstOrCreate(['name' => 'management', 'guard_name' => 'web']);
        $manager = User::factory()->create();
        $manager->assignRole('management');
        $category = SuggestionCategory::query()->create([
            'name' => 'Kategori sementara',
            'description' => 'Kategori yang aman dihapus.',
            'is_active' => true,
        ]);

        $this->actingAs($manager)
            ->deleteJson("/management/categories/{$category->id}")
            ->assertForbidden();

        $this->assertDatabaseHas('suggestion_categories', ['id' => $category->id]);
    }
}
