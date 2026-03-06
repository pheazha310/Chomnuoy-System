<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

// Define a controller class for handling Organization API requests
class OrganizationController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Organization::query()->orderByDesc('id')->get());
    }

     // Method to create new organization (POST /organizations)
    public function store(Request $request): JsonResponse
    {
        $data = $request->all();

        // Encrypt password
        $data['password'] = Hash::make($request->password);

        $record = Organization::create($data);

        return response()->json($record, 201);
    }

    // Method to get single organization by ID (GET /organizations/{id})
    public function show(int $id): JsonResponse
    {
        $record = Organization::findOrFail($id);

        return response()->json($record);
    }

    // Method to update organization (PUT/PATCH /organizations/{id})
    public function update(Request $request, int $id): JsonResponse
    {
        $record = Organization::findOrFail($id);
        $record->update($request->all());

        return response()->json($record);
    }

    // Method to delete organization (DELETE /organizations/{id})
    public function destroy(int $id): JsonResponse
    {
        $record = Organization::findOrFail($id);
        $record->delete();

        return response()->json(null, 204);
    }
}
