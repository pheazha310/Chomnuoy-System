<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Campaign;
use App\Models\CampaignImage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CampaignController extends Controller
{
    public function index(): JsonResponse
    {
        $records = Campaign::query()
            ->select('campaigns.*')
            ->addSelect([
                'image_path' => CampaignImage::select('image_path')
                    ->whereColumn('campaign_id', 'campaigns.id')
                    ->limit(1),
            ])
            ->orderByDesc('campaigns.id')
            ->get();

        return response()->json($records);
    }

    public function store(Request $request): JsonResponse
    {
        $record = Campaign::create($request->all());

        return response()->json($record, 201);
    }

    public function show(int $id): JsonResponse
    {
        $record = Campaign::query()
            ->select('campaigns.*')
            ->addSelect([
                'image_path' => CampaignImage::select('image_path')
                    ->whereColumn('campaign_id', 'campaigns.id')
                    ->limit(1),
            ])
            ->findOrFail($id);

        return response()->json($record);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $record = Campaign::findOrFail($id);
        $record->update($request->all());

        return response()->json($record);
    }

    public function destroy(int $id): JsonResponse
    {
        $record = Campaign::findOrFail($id);
        $record->delete();

        return response()->json(null, 204);
    }
}
