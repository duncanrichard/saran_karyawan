<?php

namespace App\Http\Controllers;

use App\Models\Suggestion;
use App\Models\SuggestionCategory;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class ManagementController extends Controller
{
    private const SYSTEM_ROLE_NAMES = ['employee', 'management', 'super_admin'];

    public function roles(): JsonResponse
    {
        return response()->json(['roles' => Role::query()->whereNotIn('name', ['employee', 'management'])->orderBy('name')->get()]);
    }

    public function storeRole(Request $request): JsonResponse
    {
        $data = $request->validate(['name' => ['required', 'string', 'max:60', 'unique:roles,name'], 'description' => ['nullable', 'string', 'max:500']]);

        return response()->json(['role' => Role::create($data)], 201);
    }

    public function updateRole(Request $request, Role $role): JsonResponse
    {
        $data = $request->validate(['name' => ['required', 'string', 'max:60', Rule::unique('roles', 'name')->ignore($role->id)], 'description' => ['nullable', 'string', 'max:500']]);
        $role->update($data);

        return response()->json(['role' => $role->fresh()]);
    }

    public function destroyRole(Role $role): JsonResponse
    {
        abort_if(in_array($role->name, ['employee', 'management', 'super_admin'], true), 422, 'Role bawaan sistem tidak dapat dihapus.');
        $role->delete();

        return response()->json(['message' => 'Role berhasil dihapus.']);
    }

    public function dashboard(): JsonResponse
    {
        return response()->json([
            'dashboard' => [
                'total_tickets' => Suggestion::query()->count(),
                'today_tickets' => Suggestion::query()->whereDate('submitted_at', today())->count(),
                'anonymous_tickets' => Suggestion::query()->where('is_anonymous', true)->count(),
                'management_responses' => DB::table('suggestion_messages')->where('sender_type', 'management')->count(),
                'active_categories' => SuggestionCategory::query()->where('is_active', true)->count(),
                'recent_tickets' => Suggestion::query()->with('category:id,name')->latest('submitted_at')->limit(5)->get(['id', 'ticket_number', 'category_id', 'title', 'submitted_at']),
                'category_complaints' => SuggestionCategory::query()
                    ->leftJoin('suggestions', 'suggestions.category_id', '=', 'suggestion_categories.id')
                    ->select('suggestion_categories.id', 'suggestion_categories.name', DB::raw('COUNT(suggestions.id) as total'))
                    ->groupBy('suggestion_categories.id', 'suggestion_categories.name')
                    ->orderByDesc('total')
                    ->limit(7)
                    ->get(),
            ],
        ]);
    }

    public function notifications(Request $request): JsonResponse
    {
        $notifications = DB::table('notifications')
            ->where('user_id', $request->user()->id)
            ->latest('created_at')
            ->limit(20)
            ->get(['id', 'suggestion_id', 'type', 'title', 'body', 'read_at', 'created_at']);

        return response()->json([
            'notifications' => $notifications,
            'unread_count' => $notifications->whereNull('read_at')->count(),
        ]);
    }

    public function markNotificationRead(Request $request, string $notification): JsonResponse
    {
        $updated = DB::table('notifications')
            ->where('id', $notification)
            ->where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->update(['read_at' => now(), 'updated_at' => now()]);

        abort_unless($updated || DB::table('notifications')->where('id', $notification)->where('user_id', $request->user()->id)->exists(), 404);

        return response()->json(['message' => 'Notifikasi telah dibaca.']);
    }

    public function suggestions(Request $request): JsonResponse
    {
        $data = $request->validate([
            'search' => ['nullable', 'string', 'max:120'],
            'response_filter' => ['nullable', Rule::in(['unanswered', 'answered'])],
            'category_id' => ['nullable', 'uuid', 'exists:suggestion_categories,id'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
        ]);
        $search = trim((string) ($data['search'] ?? ''));
        $paginator = Suggestion::query()
            ->with(['category:id,name', 'submittedBy:id,first_name,last_name,username'])
            ->when(! $request->user()->hasRole('super_admin'), fn ($query) => $query->whereIn('category_id', $request->user()->handledCategories()->select('suggestion_categories.id')))
            ->when($search !== '', function ($query) use ($search): void {
                $query->where(function ($nested) use ($search): void {
                    $nested->where('ticket_number', 'ilike', "%{$search}%")
                        ->orWhere('title', 'ilike', "%{$search}%")
                        ->orWhereHas('category', fn ($category) => $category->where('name', 'ilike', "%{$search}%"));
                });
            })
            ->when(($data['response_filter'] ?? null) === 'unanswered', fn ($query) => $query->whereDoesntHave('messages', fn ($messages) => $messages->where('sender_type', 'management')))
            ->when(($data['response_filter'] ?? null) === 'answered', fn ($query) => $query->whereHas('messages', fn ($messages) => $messages->where('sender_type', 'management')))
            ->when(isset($data['category_id']), fn ($query) => $query->where('category_id', $data['category_id']))
            ->when(isset($data['date_from']), fn ($query) => $query->whereDate('submitted_at', '>=', $data['date_from']))
            ->when(isset($data['date_to']), fn ($query) => $query->whereDate('submitted_at', '<=', $data['date_to']))
            ->latest('submitted_at')
            ->paginate(10);

        return response()->json([
            'suggestions' => $paginator->items(),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function showSuggestion(Suggestion $suggestion): JsonResponse
    {
        $this->ensureSuggestionAccess(request(), $suggestion);

        return response()->json(['suggestion' => $suggestion->load([
            'category:id,name',
            'attachments:id,suggestion_id,original_name,mime_type,size,url_system',
            'submittedBy:id,first_name,last_name,username',
            'messages.sender:id,first_name,last_name,role',
        ])]);
    }

    public function storeMessage(Request $request, Suggestion $suggestion): JsonResponse
    {
        $this->ensureSuggestionAccess($request, $suggestion);
        $data = $request->validate(['body' => ['required', 'string', 'max:3000']]);
        $message = $suggestion->messages()->create([
            'sender_id' => $request->user()->id,
            'body' => $data['body'],
            'sender_type' => 'management',
            'is_internal' => false,
        ]);
        $this->notifyOwner($suggestion, 'Respons baru', 'Management telah memberikan respons pada tiket Anda.');

        return response()->json(['message' => $message->load('sender:id,first_name,last_name,role')], 201);
    }

    public function updateWorkflow(Request $request, Suggestion $suggestion): JsonResponse
    {
        $this->ensureSuggestionAccess($request, $suggestion);
        $data = $request->validate(['status' => ['required', Rule::in(['Baru', 'Diproses', 'Menunggu karyawan', 'Selesai'])], 'priority' => ['required', Rule::in(['Rendah', 'Sedang', 'Tinggi'])], 'assignee_id' => ['nullable', 'uuid', 'exists:users,id'], 'note' => ['nullable', 'string', 'max:1000']]);
        $due = now()->addDays(['Tinggi' => 1, 'Sedang' => 3, 'Rendah' => 7][$data['priority']]);
        DB::transaction(function () use ($request, $suggestion, $data, $due): void {
            $before = $suggestion->status;
            $suggestion->update(['status' => $data['status'], 'priority' => $data['priority'], 'sla_due_at' => $due, 'closed_at' => $data['status'] === 'Selesai' ? now() : null]);
            DB::table('suggestion_status_histories')->insert(['id' => (string) Str::uuid7(), 'suggestion_id' => $suggestion->id, 'changed_by' => $request->user()->id, 'from_status' => $before, 'to_status' => $data['status'], 'note' => $data['note'] ?? null, 'created_at' => now(), 'updated_at' => now()]);
            if (! empty($data['assignee_id'])) DB::table('suggestion_assignments')->updateOrInsert(['suggestion_id' => $suggestion->id, 'assignee_id' => $data['assignee_id']], ['id' => (string) Str::uuid7(), 'assigned_by' => $request->user()->id, 'assigned_at' => now(), 'is_active' => true, 'updated_at' => now(), 'created_at' => now()]);
        });
        $this->notifyOwner($suggestion, 'Status tiket diperbarui', "Status tiket menjadi {$data['status']}.");
        return response()->json(['suggestion' => $suggestion->fresh()]);
    }

    public function routeSuggestion(Request $request, Suggestion $suggestion): JsonResponse
    {
        abort_unless($request->user()->hasRole('super_admin'), 403);
        $data = $request->validate(['category_id' => ['required', 'uuid', 'exists:suggestion_categories,id']]);
        $category = SuggestionCategory::query()->findOrFail($data['category_id']);
        abort_if(strcasecmp($category->name, 'Lainnya') === 0, 422, 'Pilih kategori tujuan selain Lainnya.');

        $suggestion->update(['category_id' => $category->id, 'status' => 'Diproses']);

        return response()->json(['suggestion' => $suggestion->fresh()->load('category:id,name')]);
    }

    private function notifyOwner(Suggestion $suggestion, string $title, string $body): void
    {
        if ($suggestion->created_by) DB::table('notifications')->insert(['id' => (string) Str::uuid7(), 'user_id' => $suggestion->created_by, 'suggestion_id' => $suggestion->id, 'type' => 'ticket', 'title' => $title, 'body' => $body, 'created_at' => now(), 'updated_at' => now()]);
    }

    private function ensureSuggestionAccess(Request $request, Suggestion $suggestion): void
    {
        if ($request->user()->hasRole('super_admin')) return;

        abort_unless($request->user()->handledCategories()->whereKey($suggestion->category_id)->exists(), 403);
    }

    public function categories(): JsonResponse
    {
        return response()->json(['categories' => SuggestionCategory::query()->orderByDesc('is_active')->orderBy('name')->get()]);
    }

    public function storeCategory(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100', 'unique:suggestion_categories,name'],
            'description' => ['nullable', 'string', 'max:500'],
        ]);

        return response()->json(['category' => SuggestionCategory::create([...$data, 'is_active' => true])], 201);
    }

    public function updateCategory(Request $request, SuggestionCategory $category): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100', Rule::unique('suggestion_categories', 'name')->ignore($category->id)],
            'description' => ['nullable', 'string', 'max:500'],
            'is_active' => ['required', 'boolean'],
        ]);
        $category->update($data);

        return response()->json(['category' => $category->fresh()]);
    }

    public function destroyCategory(SuggestionCategory $category): JsonResponse
    {
        abort_if(
            Suggestion::query()->where('category_id', $category->id)->exists(),
            422,
            'Kategori tidak dapat dihapus karena sudah digunakan oleh tiket.'
        );

        $category->delete();

        return response()->json(['message' => 'Kategori berhasil dihapus.']);
    }

    public function managementUsers(): JsonResponse
    {
        return response()->json([
            'users' => User::query()->with(['roles:id,name,description', 'handledCategories:id,name'])->orderBy('first_name')->orderBy('last_name')->get(['id', 'first_name', 'last_name', 'username', 'email', 'role', 'is_active', 'created_at']),
            'roles' => Role::query()->whereNotIn('name', ['employee', 'management'])->orderBy('name')->get(['id', 'name', 'description']),
            'categories' => SuggestionCategory::query()->where('is_active', true)->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function storeManagementUser(Request $request): JsonResponse
    {
        $data = $request->validate([
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'username' => ['required', 'string', 'max:60', 'alpha_dash'],
            'email' => ['required', 'email', 'max:255'],
            'password' => ['nullable', 'string', 'min:12', 'confirmed'],
            'accesses' => ['required', 'array', 'min:1'],
            'accesses.*' => [Rule::in(['employee', 'management'])],
            'role_id' => ['nullable', 'uuid', Rule::exists('roles', 'id')->whereNotIn('name', self::SYSTEM_ROLE_NAMES)],
            'category_ids' => ['nullable', 'array'],
            'category_ids.*' => ['uuid', 'exists:suggestion_categories,id'],
        ]);

        $userByEmail = User::query()->where('email', $data['email'])->first();
        $userByUsername = User::query()->where('username', $data['username'])->first();
        abort_if($userByEmail && $userByUsername && $userByEmail->id !== $userByUsername->id, 422, 'Email dan username sudah digunakan oleh akun yang berbeda.');

        $user = $userByEmail ?? $userByUsername;
        if ($user) {
            abort_if($user->email !== $data['email'] || $user->username !== $data['username'], 422, 'Gunakan email dan username dari akun karyawan yang sudah terdaftar.');
        } else {
            abort_if(empty($data['password']), 422, 'Password wajib diisi untuk akun baru.');
            $user = User::create([
                ...$data,
                'role' => 'employee',
                'is_active' => true,
                'email_verified_at' => now(),
            ]);
        }

        $isManagement = in_array('management', $data['accesses'], true);
        $isEmployee = in_array('employee', $data['accesses'], true);
        $user->update(['role' => $isManagement && $isEmployee ? 'both' : ($isManagement ? 'management' : 'employee')]);
        $roles = $isEmployee ? ['employee'] : [];
        if ($isManagement) $roles[] = 'management';
        if ($isManagement && ! empty($data['role_id'])) $roles[] = $this->customRoleName($data['role_id']);
        $user->syncRoles(array_filter($roles));
        $user->handledCategories()->sync(
            SuggestionCategory::query()
                ->whereIn('id', $isManagement ? ($data['category_ids'] ?? []) : [])
                ->whereRaw('LOWER(name) <> ?', ['lainnya'])
                ->pluck('id')
        );

        return response()->json(['user' => $user->load(['roles:id,name,description', 'handledCategories:id,name'])], $user->wasRecentlyCreated ? 201 : 200);
    }

    public function updateUserAccess(Request $request, User $user): JsonResponse
    {
        abort_if($user->id === $request->user()->id, 422, 'Peran akun Super Admin yang sedang digunakan tidak dapat diubah.');
        abort_if($user->role === 'super_admin', 422, 'Peran Super Admin hanya dapat diatur melalui database.');

        $data = $request->validate([
            'accesses' => ['required', 'array', 'min:1'],
            'accesses.*' => [Rule::in(['employee', 'management'])],
            'is_active' => ['required', 'boolean'],
            'role_id' => ['nullable', 'uuid', Rule::exists('roles', 'id')->whereNotIn('name', self::SYSTEM_ROLE_NAMES)],
            'category_ids' => ['nullable', 'array'],
            'category_ids.*' => ['uuid', 'exists:suggestion_categories,id'],
        ]);
        $isManagement = in_array('management', $data['accesses'], true);
        $isEmployee = in_array('employee', $data['accesses'], true);
        $user->update(['role' => $isManagement && $isEmployee ? 'both' : ($isManagement ? 'management' : 'employee'), 'is_active' => $data['is_active']]);
        $roles = $isEmployee ? ['employee'] : [];
        if ($isManagement) $roles[] = 'management';
        if ($isManagement && ! empty($data['role_id'])) $roles[] = $this->customRoleName($data['role_id']);
        $user->syncRoles(array_filter($roles));
        $user->handledCategories()->sync(
            $isManagement
                ? SuggestionCategory::query()
                    ->whereIn('id', $data['category_ids'] ?? [])
                    ->whereRaw('LOWER(name) <> ?', ['lainnya'])
                    ->pluck('id')
                : []
        );

        return response()->json(['user' => $user->fresh()->load(['roles:id,name,description', 'handledCategories:id,name'])]);
    }

    private function customRoleName(string $roleId): string
    {
        return Role::query()
            ->whereKey($roleId)
            ->whereNotIn('name', self::SYSTEM_ROLE_NAMES)
            ->valueOrFail('name');
    }
}
