<?php

namespace App\Http\Controllers;

use App\Http\Requests\ClaimAnonymousSuggestionRequest;
use App\Http\Requests\StoreSuggestionRequest;
use App\Models\Suggestion;
use App\Models\SuggestionAttachment;
use App\Models\SuggestionCategory;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class SuggestionController extends Controller
{
    public function categories(): JsonResponse
    {
        return response()->json([
            'categories' => SuggestionCategory::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name']),
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $suggestions = Suggestion::query()
            ->with(['category:id,name', 'attachments:id,suggestion_id,original_name,mime_type,size,url_system', 'messages.sender:id,first_name,last_name,role'])
            ->where('created_by', $request->user()->id)
            ->latest('submitted_at')
            ->get();

        return response()->json(['suggestions' => $suggestions]);
    }

    public function store(StoreSuggestionRequest $request): JsonResponse
    {
        $data = $request->validated();
        $user = $request->user();

        $suggestion = DB::transaction(function () use ($data, $request, $user): Suggestion {
            $isAnonymous = (bool) $data['is_anonymous'];
            $suggestion = Suggestion::create([
                'ticket_number' => $this->ticketNumber(),
                'category_id' => $data['category_id'],
                'submitted_by' => $isAnonymous ? null : $user->id,
                'created_by' => $user->id,
                'department_id' => $user->department_id,
                'title' => $data['title'],
                'details' => $data['details'],
                'is_anonymous' => $isAnonymous,
                'tracking_token' => Str::random(48),
                'status' => 'Baru',
                'submitted_at' => now(),
            ]);

            DB::table('suggestion_status_histories')->insert([
                'id' => (string) Str::uuid7(),
                'suggestion_id' => $suggestion->id,
                'changed_by' => $isAnonymous ? null : $user->id,
                'from_status' => null,
                'to_status' => 'Baru',
                'note' => 'Tiket dibuat.',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            if ($request->hasFile('attachment')) {
                $file = $request->file('attachment');
                $originalName = $file->getClientOriginalName();
                $mimeType = $file->getMimeType() ?? 'application/octet-stream';
                $size = $file->getSize();
                $extension = $file->getClientOriginalExtension();
                $filename = (string) Str::uuid7().($extension ? ".{$extension}" : '');
                $directory = storage_path('app/private/suggestion-attachments');
                $location = "suggestion-attachments/{$filename}";

                File::ensureDirectoryExists($directory);
                $file->move($directory, $filename);

                $attachment = SuggestionAttachment::create([
                    'suggestion_id' => $suggestion->id,
                    'created_by' => $isAnonymous ? null : $user->id,
                    'original_name' => $originalName,
                    'location' => $location,
                    'url_system' => null,
                    'mime_type' => $mimeType,
                    'size' => $size,
                ]);
                $attachment->update(['url_system' => "/suggestions/attachments/{$attachment->id}/open"]);
            }

            return $suggestion->load(['category:id,name', 'attachments:id,suggestion_id,original_name,mime_type,size,url_system', 'messages.sender:id,first_name,last_name,role']);
        });

        $this->notifyManagementOfNewTicket($suggestion);

        return response()->json([
            'message' => 'Saran berhasil disimpan sebagai tiket.',
            'suggestion' => $suggestion,
            'tracking_token' => $suggestion->tracking_token,
        ], 201);
    }

    public function claimAnonymous(ClaimAnonymousSuggestionRequest $request): JsonResponse
    {
        $data = $request->validated();
        $suggestion = Suggestion::query()
            ->where('ticket_number', $data['ticket_number'])
            ->where('is_anonymous', true)
            ->whereNull('created_by')
            ->first();

        if (! $suggestion || ! hash_equals($suggestion->tracking_token ?? '', $data['tracking_token'])) {
            return response()->json(['message' => 'Nomor tiket atau token pelacakan tidak valid.'], 422);
        }

        $suggestion->update(['created_by' => $request->user()->id]);

        return response()->json([
            'message' => 'Tiket anonim berhasil dihubungkan ke riwayat akun Anda.',
            'suggestion' => $suggestion->load(['category:id,name', 'attachments:id,suggestion_id,original_name,mime_type,size,url_system', 'messages.sender:id,first_name,last_name,role']),
        ]);
    }

    public function openAttachment(Request $request, SuggestionAttachment $attachment)
    {
        $attachment->load('suggestion');

        abort_unless($attachment->suggestion?->created_by === $request->user()->id, 403);
        $path = storage_path("app/private/{$attachment->location}");
        if (! File::exists($path) && str_starts_with($attachment->location, 'uploads/stores/')) $path = public_path($attachment->location);
        abort_unless(File::exists($path), 404);

        return response()->file($path, [
            'Content-Type' => $attachment->mime_type,
        ]);
    }

    private function ticketNumber(): string
    {
        do {
            $ticketNumber = 'SRN-'.now()->format('Ymd').'-'.Str::upper(Str::random(6));
        } while (Suggestion::query()->where('ticket_number', $ticketNumber)->exists());

        return $ticketNumber;
    }

    private function notifyManagementOfNewTicket(Suggestion $suggestion): void
    {
        $recipientIds = User::query()
            ->where('is_active', true)
            ->whereHas('roles', fn ($roles) => $roles->whereIn('name', ['management', 'super_admin']))
            ->pluck('id');

        if ($recipientIds->isEmpty()) {
            return;
        }

        $now = now();
        DB::table('notifications')->insert($recipientIds->map(fn (string $userId) => [
            'id' => (string) Str::uuid7(),
            'user_id' => $userId,
            'suggestion_id' => $suggestion->id,
            'type' => 'new_ticket',
            'title' => 'Tiket baru masuk',
            'body' => "{$suggestion->ticket_number}: {$suggestion->title}",
            'created_at' => $now,
            'updated_at' => $now,
        ])->all());
    }
}
