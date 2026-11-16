<?php

namespace Tests\Feature;

use App\Events\NewManagementTicket;
use App\Models\Permission;
use App\Models\Role;
use App\Models\Suggestion;
use App\Models\SuggestionCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class ManagementSecurityScopeTest extends TestCase
{
    use RefreshDatabase;

    public function test_management_dashboard_and_category_list_are_limited_to_handled_categories(): void
    {
        $allowedCategory = SuggestionCategory::query()->create(['name' => 'Scope teknologi', 'is_active' => true]);
        $restrictedCategory = SuggestionCategory::query()->create(['name' => 'Scope kesejahteraan', 'is_active' => true]);
        $manager = $this->managerFor($allowedCategory);

        $this->createSuggestion($allowedCategory, 'SRN-ALLOWED');
        $this->createSuggestion($restrictedCategory, 'SRN-RESTRICTED');

        $this->actingAs($manager)
            ->getJson('/management/dashboard')
            ->assertOk()
            ->assertJsonPath('dashboard.total_tickets', 1)
            ->assertJsonCount(1, 'dashboard.recent_tickets')
            ->assertJsonPath('dashboard.recent_tickets.0.ticket_number', 'SRN-ALLOWED')
            ->assertJsonCount(1, 'dashboard.category_complaints')
            ->assertJsonPath('dashboard.category_complaints.0.id', $allowedCategory->id);

        $this->actingAs($manager)
            ->getJson('/management/ticket-categories')
            ->assertOk()
            ->assertJsonCount(1, 'categories')
            ->assertJsonPath('categories.0.id', $allowedCategory->id)
            ->assertJsonMissing(['id' => $restrictedCategory->id]);
    }

    public function test_management_report_only_aggregates_handled_categories(): void
    {
        $allowedCategory = SuggestionCategory::query()->create(['name' => 'Laporan teknologi', 'is_active' => true]);
        $restrictedCategory = SuggestionCategory::query()->create(['name' => 'Laporan keuangan', 'is_active' => true]);
        $manager = $this->managerFor($allowedCategory);
        $this->createSuggestion($allowedCategory, 'SRN-REPORT-ALLOWED');
        $this->createSuggestion($restrictedCategory, 'SRN-REPORT-RESTRICTED');

        $this->actingAs($manager)
            ->getJson('/management/reports')
            ->assertOk()
            ->assertJsonPath('report.summary.total', 1)
            ->assertJsonCount(1, 'report.by_category')
            ->assertJsonPath('report.by_category.0.id', $allowedCategory->id)
            ->assertJsonMissing(['id' => $restrictedCategory->id]);
    }

    public function test_management_can_export_scoped_report_as_an_excel_workbook(): void
    {
        $category = SuggestionCategory::query()->create(['name' => 'Ekspor laporan', 'is_active' => true]);
        $manager = $this->managerFor($category);
        $this->createSuggestion($category, 'SRN-REPORT-EXCEL');

        $response = $this->actingAs($manager)->get('/management/reports/export');

        $response->assertOk()
            ->assertHeader('content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        $this->assertStringStartsWith('PK', $response->streamedContent());
    }

    public function test_ticket_notification_and_realtime_event_only_reach_authorized_management(): void
    {
        Event::fake();
        $allowedCategory = SuggestionCategory::query()->create(['name' => 'Notifikasi fasilitas', 'is_active' => true]);
        $restrictedCategory = SuggestionCategory::query()->create(['name' => 'Notifikasi lingkungan', 'is_active' => true]);
        $authorizedManager = $this->managerFor($allowedCategory);
        $otherManager = $this->managerFor($restrictedCategory);
        $superAdmin = User::factory()->create(['is_active' => true]);
        $superAdminRole = Role::firstOrCreate(['name' => 'super_admin', 'guard_name' => 'web']);
        $superAdmin->assignRole($superAdminRole);
        $employee = User::factory()->create();

        $response = $this->actingAs($employee)->postJson('/suggestions', [
            'category_id' => $allowedCategory->id,
            'title' => 'Perbaikan kursi kerja',
            'details' => 'Beberapa kursi perlu diganti karena tidak layak dipakai.',
            'is_anonymous' => false,
        ])->assertCreated();

        $suggestionId = $response->json('suggestion.id');
        $this->assertDatabaseHas('notifications', ['user_id' => $authorizedManager->id, 'suggestion_id' => $suggestionId]);
        $this->assertDatabaseHas('notifications', ['user_id' => $superAdmin->id, 'suggestion_id' => $suggestionId]);
        $this->assertDatabaseMissing('notifications', ['user_id' => $otherManager->id, 'suggestion_id' => $suggestionId]);
        Event::assertDispatched(NewManagementTicket::class, fn (NewManagementTicket $event) => count($event->recipientIds) === 2
            && in_array($authorizedManager->id, $event->recipientIds, true)
            && in_array($superAdmin->id, $event->recipientIds, true));
    }

    public function test_unverified_management_account_cannot_log_in(): void
    {
        $managementRole = Role::firstOrCreate(['name' => 'management', 'guard_name' => 'web']);
        $unverified = User::factory()->create([
            'username' => 'belum_terverifikasi',
            'password' => 'PasswordAman!123',
            'email_verified_at' => null,
        ]);
        $unverified->assignRole($managementRole);

        $this->postJson('/management/auth/login', [
            'username' => $unverified->username,
            'password' => 'PasswordAman!123',
        ])->assertUnprocessable()->assertJsonValidationErrors('username');

        $unverified->forceFill(['email_verified_at' => now()])->save();

        $this->postJson('/management/auth/login', [
            'username' => $unverified->username,
            'password' => 'PasswordAman!123',
        ])->assertOk();
    }

    public function test_registration_and_otp_verification_are_rate_limited(): void
    {
        foreach (range(1, 3) as $attempt) {
            $this->postJson('/auth/register', [])->assertUnprocessable();
        }
        $this->postJson('/auth/register', [])->assertTooManyRequests();

        foreach (range(1, 5) as $attempt) {
            $this->postJson('/auth/verify-email', [
                'email' => 'tidak-ada@example.com',
                'code' => '123456',
            ])->assertNotFound();
        }
        $this->postJson('/auth/verify-email', [
            'email' => 'tidak-ada@example.com',
            'code' => '123456',
        ])->assertTooManyRequests();
    }

    private function managerFor(SuggestionCategory $category): User
    {
        $role = Role::firstOrCreate(['name' => 'management', 'guard_name' => 'web']);
        $permission = Permission::query()->firstOrCreate([
            'name' => 'ticket.view',
            'guard_name' => 'web',
        ]);
        $manager = User::factory()->create(['is_active' => true]);
        $manager->assignRole($role);
        $manager->givePermissionTo($permission);
        $manager->handledCategories()->sync([$category->id]);

        return $manager;
    }

    private function createSuggestion(SuggestionCategory $category, string $ticketNumber): Suggestion
    {
        return Suggestion::query()->create([
            'ticket_number' => $ticketNumber,
            'category_id' => $category->id,
            'title' => 'Tiket '.strtolower($ticketNumber),
            'details' => 'Rincian tiket untuk pengujian pembatasan kategori.',
            'is_anonymous' => false,
            'tracking_token' => str_repeat('a', 48).$ticketNumber,
            'status' => 'Baru',
            'submitted_at' => now(),
        ]);
    }
}
