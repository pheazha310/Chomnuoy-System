<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Category;
use App\Models\Organization;
use App\Models\Role;
use App\Models\User;
use App\Models\UserCredential;
use App\Models\UserRole;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;



class AuthControllerRegister extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(AuditLog::query()->orderByDesc('id')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $record = AuditLog::create($request->all());

        return response()->json($record, 201);
    }

    public function show(int $id): JsonResponse
    {
        $record = AuditLog::findOrFail($id);

        return response()->json($record);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $record = AuditLog::findOrFail($id);
        $record->update($request->all());

        return response()->json($record);
    }

    public function destroy(int $id): JsonResponse
    {
        $record = AuditLog::findOrFail($id);
        $record->delete();

        return response()->json(null, 204);
    }

    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => [Rule::requiredIf(fn() => $request->role === 'Donor'), 'nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'email' => ['required', 'email', 'max:255'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', 'string', Rule::in(['Donor', 'Organization'])],
            'organization' => ['nullable', 'array'],
            'organization.name' => [Rule::requiredIf(fn () => $request->input('role') === 'Organization'), 'nullable', 'string', 'max:255'],
            'organization.category_id' => [
                'nullable',
                'integer',
                'exists:categories,id',
                Rule::requiredIf(fn () => $request->input('role') === 'Organization'
                    && empty($request->input('organization.category_name_new'))),
            ],
            'organization.category_name_new' => [
                'nullable',
                'string',
                'max:255',
                Rule::requiredIf(fn () => $request->input('role') === 'Organization'
                    && empty($request->input('organization.category_id'))),
            ],
            'organization.location' => ['nullable', 'string', 'max:255'],
            'organization.description' => ['nullable', 'string'],
        ]);

        if (User::where('email', $data['email'])->exists() || Organization::where('email', $data['email'])->exists()) {
            throw ValidationException::withMessages([
                'email' => ['This email is already registered. Please use another email.'],
            ]);
        }

        $result = DB::transaction(function () use ($data) {
            if ($data['role'] === 'Organization') {
                $organizationData = $data['organization'] ?? [];
                $categoryId = $organizationData['category_id'] ?? null;

                if (!$categoryId && !empty($organizationData['category_name_new'])) {
                    $category = Category::firstOrCreate([
                        'category_name' => trim($organizationData['category_name_new']),
                    ]);
                    $categoryId = $category->id;
                }

                $organization = Organization::create([
                    'name' => $organizationData['name'],
                    'email' => $data['email'],
                    'password' => Hash::make($data['password']),
                    'category_id' => $categoryId,
                    'location' => $organizationData['location'] ?? null,
                    'description' => $organizationData['description'] ?? null,
                    'verified_status' => 'pending',
                ]);

                return [
                    'account_type' => 'Organization',
                    'user' => null,
                    'organization' => $organization,
                ];
            }

            $role = Role::firstOrCreate(['role_name' => 'Donor']);
            $userData = [
                'name' => $data['name'],
                'phone' => $data['phone'] ?? null,
                'email' => $data['email'],
                'status' => 'active',
            ];

            if (Schema::hasColumn('users', 'password')) {
                $userData['password'] = Hash::make($data['password']);
            }
            if (Schema::hasColumn('users', 'role_id')) {
                $userData['role_id'] = $role->id;
            }

            $user = User::create($userData);

            if (!Schema::hasColumn('users', 'password')) {
                UserCredential::create([
                    'user_id' => $user->id,
                    'password' => Hash::make($data['password']),
                ]);
            }

            if (!Schema::hasColumn('users', 'role_id')) {
                UserRole::firstOrCreate([
                    'user_id' => $user->id,
                    'role_id' => $role->id,
                ]);
            }

            return [
                'account_type' => 'Donor',
                'user' => $user,
                'organization' => null,
            ];
        });

        return response()->json([
            'message' => 'Registered successfully',
            'account_type' => $result['account_type'],
            'user' => $result['user'],
            'organization' => $result['organization'],
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $email = strtolower(trim($data['email']));
        $password = $data['password'];

        $user = User::whereRaw('LOWER(email) = ?', [$email])->first();
        $organization = Organization::whereRaw('LOWER(email) = ?', [$email])->first();

        $userPasswordMatches = false;
        if ($user) {
            if (Schema::hasColumn('users', 'password')) {
                $userPasswordMatches = Hash::check($password, (string) $user->password);
            } else {
                $credential = UserCredential::where('user_id', $user->id)->first();
                $userPasswordMatches = $credential && Hash::check($password, (string) $credential->password);
            }
        }

        if ($user && $userPasswordMatches) {
            return response()->json([
                'message' => 'Login successful',
                'account_type' => 'Donor',
                'user' => $user,
                'organization' => null,
            ]);
        }

        if ($organization) {
            $organizationPassword = (string) $organization->password;
            $matchesHashed = Hash::check($password, $organizationPassword);
            $matchesPlaintext = hash_equals($organizationPassword, $password);

            if (!($matchesHashed || $matchesPlaintext)) {
                throw ValidationException::withMessages([
                    'password' => ['Password is incorrect.'],
                ]);
            }

            // If legacy plaintext password exists, upgrade it to a hash.
            if ($matchesPlaintext && !$matchesHashed) {
                $organization->password = Hash::make($password);
                $organization->save();
            }

            return response()->json([
                'message' => 'Login successful',
                'account_type' => 'Organization',
                'user' => null,
                'organization' => $organization,
            ]);
        }

        if ($user || $organization) {
            throw ValidationException::withMessages([
                'password' => ['Password is incorrect.'],
            ]);
        }

        throw ValidationException::withMessages([
            'email' => ['Email not found. Please register first.'],
        ]);
    }
}
