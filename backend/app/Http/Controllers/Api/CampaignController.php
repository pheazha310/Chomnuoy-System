<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Campaign;
use App\Models\CampaignImage;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

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

    public function donations(int $id): JsonResponse
    {
        Campaign::findOrFail($id);

        $records = DB::table('donations')
            ->join('users', 'users.id', '=', 'donations.user_id')
            ->select(
                'donations.id',
                'users.name as donor_name',
                'donations.amount',
                'donations.status',
                'donations.created_at'
            )
            ->where('donations.campaign_id', $id)
            ->orderByDesc('donations.created_at')
            ->limit(10)
            ->get();

        return response()->json($records);
    }

    public function velocity(Request $request, int $id): JsonResponse
    {
        Campaign::findOrFail($id);

        $days = (int) $request->query('days', 30);
        if ($days < 7) {
            $days = 7;
        }
        if ($days > 365) {
            $days = 365;
        }

        $end = Carbon::today();
        $start = $end->copy()->subDays($days - 1);

        $rows = DB::table('donations')
            ->select(DB::raw('DATE(created_at) as date'), DB::raw('SUM(amount) as total'))
            ->where('campaign_id', $id)
            ->where('status', 'completed')
            ->whereBetween('created_at', [$start->toDateString(), $end->toDateString()])
            ->groupBy(DB::raw('DATE(created_at)'))
            ->orderBy(DB::raw('DATE(created_at)'))
            ->get()
            ->keyBy('date');

        $series = [];
        for ($date = $start->copy(); $date->lte($end); $date->addDay()) {
            $key = $date->toDateString();
            $total = $rows[$key]->total ?? 0;
            $series[] = [
                'date' => $key,
                'total' => (float) $total,
            ];
        }

        return response()->json([
            'days' => $days,
            'series' => $series,
        ]);
    }
}
