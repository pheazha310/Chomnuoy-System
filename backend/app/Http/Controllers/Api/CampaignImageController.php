<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CampaignImage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class CampaignImageController extends Controller
{
    public function index(): JsonResponse
    {
        $campaignId = request()->query('campaign_id');

        $query = CampaignImage::query()->orderByDesc('id');

        if ($campaignId !== null && $campaignId !== '') {
            $query->where('campaign_id', $campaignId);
        }

        return response()->json($query->get());
    }

    public function store(Request $request): JsonResponse
    {
        if ($request->hasFile('image')) {
            $validated = $request->validate([
                'campaign_id' => ['required', 'integer', 'exists:campaigns,id'],
                'image' => ['required', 'image', 'max:5120'],
            ]);

            $path = $request->file('image')->store('campaigns', 'public');

            $record = CampaignImage::create([
                'campaign_id' => $validated['campaign_id'],
                'image_path' => $path,
            ]);

            return response()->json($record, 201);
        }

        $validated = $request->validate([
            'campaign_id' => ['required', 'integer', 'exists:campaigns,id'],
            'image_path' => ['required', 'string', 'max:255'],
        ]);

        $record = CampaignImage::create($validated);

        return response()->json($record, 201);
    }

    public function show(int $id): JsonResponse
    {
        $record = CampaignImage::findOrFail($id);

        return response()->json($record);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $record = CampaignImage::findOrFail($id);
        if ($request->hasFile('image')) {
            $validated = $request->validate([
                'campaign_id' => ['sometimes', 'integer', 'exists:campaigns,id'],
                'image' => ['required', 'image', 'max:5120'],
            ]);

            if ($record->image_path) {
                Storage::disk('public')->delete($record->image_path);
            }

            $path = $request->file('image')->store('campaigns', 'public');
            $record->update([
                'campaign_id' => $validated['campaign_id'] ?? $record->campaign_id,
                'image_path' => $path,
            ]);

            return response()->json($record);
        }

        $validated = $request->validate([
            'campaign_id' => ['sometimes', 'integer', 'exists:campaigns,id'],
            'image_path' => ['sometimes', 'string', 'max:255'],
        ]);

        $record->update($validated);

        return response()->json($record);
    }

    public function destroy(int $id): Response
    {
        $record = CampaignImage::findOrFail($id);
        if ($record->image_path) {
            Storage::disk('public')->delete($record->image_path);
        }
        $record->delete();

        return response()->noContent();
    }
}
