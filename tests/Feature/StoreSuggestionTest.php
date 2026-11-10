<?php

namespace Tests\Feature;

use App\Models\SuggestionCategory;
use App\Models\Suggestion;
use App\Models\SuggestionAttachment;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Tests\TestCase;

class StoreSuggestionTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_employee_can_store_a_suggestion_with_uuid_audit_fields(): void
    {
        $user = User::factory()->create();
        $category = SuggestionCategory::query()->firstOrCreate(
            ['name' => 'Proses kerja'],
            ['is_active' => true],
        );

        $response = $this->actingAs($user)->postJson('/suggestions', [
            'category_id' => $category->id,
            'title' => 'Perbaiki alur permintaan alat kerja',
            'details' => 'Ajukan formulir digital agar proses dapat dilacak oleh pemohon.',
            'is_anonymous' => false,
        ]);

        $response->assertCreated()
            ->assertJsonPath('suggestion.category.id', $category->id)
            ->assertJsonPath('suggestion.created_by', $user->id)
            ->assertJsonPath('suggestion.submitted_by', $user->id);

        $this->assertDatabaseHas('suggestions', [
            'id' => $response->json('suggestion.id'),
            'created_by' => $user->id,
            'submitted_by' => $user->id,
            'status' => 'Baru',
        ]);
        $this->assertDatabaseHas('suggestion_status_histories', [
            'suggestion_id' => $response->json('suggestion.id'),
            'to_status' => 'Baru',
        ]);
        $this->assertTrue(Str::isUuid($response->json('suggestion.id')));
        $this->assertNotNull($response->json('suggestion.created_at'));
    }

    public function test_new_ticket_creates_a_notification_for_active_management_users(): void
    {
        $employee = User::factory()->create();
        $manager = User::factory()->create(['is_active' => true]);
        $inactiveManager = User::factory()->create(['is_active' => false]);
        Role::firstOrCreate(['name' => 'management', 'guard_name' => 'web']);
        $manager->assignRole('management');
        $inactiveManager->assignRole('management');
        $category = SuggestionCategory::query()->firstOrCreate(['name' => 'Teknologi'], ['is_active' => true]);

        $response = $this->actingAs($employee)->postJson('/suggestions', [
            'category_id' => $category->id,
            'title' => 'Perangkat rapat perlu diperbarui',
            'details' => 'Kamera ruang rapat tidak dapat dipakai untuk rapat daring.',
            'is_anonymous' => false,
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('notifications', [
            'user_id' => $manager->id,
            'suggestion_id' => $response->json('suggestion.id'),
            'type' => 'new_ticket',
            'title' => 'Tiket baru masuk',
        ]);
        $this->assertDatabaseMissing('notifications', ['user_id' => $inactiveManager->id]);
    }

    public function test_anonymous_suggestion_does_not_store_employee_identity(): void
    {
        $user = User::factory()->create();
        $category = SuggestionCategory::query()->firstOrCreate(
            ['name' => 'Kesejahteraan'],
            ['is_active' => true],
        );

        $response = $this->actingAs($user)->postJson('/suggestions', [
            'category_id' => $category->id,
            'title' => 'Tambahkan ruang tenang',
            'details' => 'Sediakan ruang singkat untuk beristirahat saat membutuhkan fokus.',
            'is_anonymous' => true,
        ]);

        $response->assertCreated()
            ->assertJsonPath('suggestion.created_by', $user->id)
            ->assertJsonPath('suggestion.submitted_by', null)
            ->assertJsonStructure(['tracking_token']);
    }

    public function test_employee_can_list_both_anonymous_and_identified_tickets_created_by_them(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $category = SuggestionCategory::query()->firstOrCreate(['name' => 'Teknologi'], ['is_active' => true]);

        Suggestion::query()->create([
            'ticket_number' => 'SRN-TEST-IDENTIFIED',
            'category_id' => $category->id,
            'submitted_by' => $user->id,
            'created_by' => $user->id,
            'title' => 'Tiket teridentifikasi',
            'details' => 'Tiket milik pengguna yang masuk.',
            'is_anonymous' => false,
            'tracking_token' => 'identified-token',
            'status' => 'Baru',
            'submitted_at' => now(),
        ]);
        Suggestion::query()->create([
            'ticket_number' => 'SRN-TEST-ANONYMOUS',
            'category_id' => $category->id,
            'created_by' => $user->id,
            'title' => 'Tiket anonim',
            'details' => 'Identitas pengirim tidak ditampilkan ke petugas.',
            'is_anonymous' => true,
            'tracking_token' => 'anonymous-token',
            'status' => 'Baru',
            'submitted_at' => now(),
        ]);
        Suggestion::query()->create([
            'ticket_number' => 'SRN-OTHER-USER',
            'category_id' => $category->id,
            'created_by' => $otherUser->id,
            'title' => 'Tiket pengguna lain',
            'details' => 'Tidak boleh terlihat.',
            'is_anonymous' => false,
            'tracking_token' => 'other-user-token',
            'status' => 'Baru',
            'submitted_at' => now(),
        ]);

        $this->actingAs($user)
            ->getJson('/suggestions')
            ->assertOk()
            ->assertJsonCount(2, 'suggestions')
            ->assertJsonFragment(['ticket_number' => 'SRN-TEST-IDENTIFIED', 'is_anonymous' => false])
            ->assertJsonFragment(['ticket_number' => 'SRN-TEST-ANONYMOUS', 'is_anonymous' => true])
            ->assertJsonMissing(['ticket_number' => 'SRN-OTHER-USER']);
    }

    public function test_store_endpoint_accepts_anonymous_value_from_multipart_form_data(): void
    {
        $user = User::factory()->create();
        $category = SuggestionCategory::query()->firstOrCreate(
            ['name' => 'Lainnya'],
            ['is_active' => true],
        );

        $response = $this->actingAs($user)->post('/suggestions', [
            'category_id' => $category->id,
            'title' => 'Saran anonim dari formulir',
            'details' => 'Nilai true dari FormData harus diterima sebagai boolean.',
            'is_anonymous' => 'true',
        ], ['Accept' => 'application/json']);

        $response->assertCreated()
            ->assertJsonPath('suggestion.is_anonymous', true)
            ->assertJsonPath('suggestion.created_by', $user->id);
    }

    public function test_employee_can_claim_anonymous_ticket_created_before_owner_tracking_was_added(): void
    {
        $user = User::factory()->create();
        $category = SuggestionCategory::query()->firstOrCreate(['name' => 'Fasilitas kantor'], ['is_active' => true]);
        $token = str_repeat('a', 48);
        $suggestion = Suggestion::query()->create([
            'ticket_number' => 'SRN-LEGACY-ANONYMOUS',
            'category_id' => $category->id,
            'title' => 'Tiket anonim lama',
            'details' => 'Dibuat sebelum pemilik privat disimpan.',
            'is_anonymous' => true,
            'tracking_token' => $token,
            'status' => 'Baru',
            'submitted_at' => now(),
        ]);

        $this->actingAs($user)
            ->postJson('/suggestions/claim-anonymous', [
                'ticket_number' => $suggestion->ticket_number,
                'tracking_token' => $token,
            ])
            ->assertOk()
            ->assertJsonPath('suggestion.created_by', $user->id);

        $this->assertDatabaseHas('suggestions', ['id' => $suggestion->id, 'created_by' => $user->id]);
    }

    public function test_ticket_owner_can_open_their_pdf_attachment_but_another_employee_cannot(): void
    {
        $owner = User::factory()->create();
        $otherEmployee = User::factory()->create();
        $category = SuggestionCategory::query()->firstOrCreate(['name' => 'Lingkungan kerja'], ['is_active' => true]);
        $suggestion = Suggestion::query()->create([
            'ticket_number' => 'SRN-PDF-ATTACHMENT',
            'category_id' => $category->id,
            'created_by' => $owner->id,
            'title' => 'Lampiran PDF',
            'details' => 'Berkas pendukung dapat dibuka oleh pemilik tiket.',
            'is_anonymous' => false,
            'tracking_token' => 'pdf-attachment-token',
            'status' => 'Baru',
            'submitted_at' => now(),
        ]);
        $location = 'uploads/stores/blueprint.pdf';
        $file = public_path($location);
        File::ensureDirectoryExists(dirname($file));
        File::put($file, '%PDF-1.4');
        $attachment = SuggestionAttachment::query()->create([
            'suggestion_id' => $suggestion->id,
            'created_by' => $owner->id,
            'original_name' => 'blueprint.pdf',
            'location' => $location,
            'url_system' => url($location),
            'mime_type' => 'application/pdf',
            'size' => 8,
        ]);

        try {
            $this->actingAs($owner)
                ->get("/suggestions/attachments/{$attachment->id}/open")
                ->assertOk()
                ->assertHeader('content-type', 'application/pdf');

            $this->actingAs($otherEmployee)
                ->get("/suggestions/attachments/{$attachment->id}/open")
                ->assertForbidden();
        } finally {
            File::delete($file);
        }
    }
}
