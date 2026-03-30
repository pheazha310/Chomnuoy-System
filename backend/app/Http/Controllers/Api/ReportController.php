<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Report;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ReportController extends Controller
{
    public function adminDashboard(Request $request): JsonResponse
    {
        $days = (int) $request->query('days', 30);
        if (!in_array($days, [7, 30, 90], true)) {
            $days = 30;
        }

        $includePending = filter_var($request->query('include_pending', true), FILTER_VALIDATE_BOOLEAN);
        $start = Carbon::today()->subDays($days - 1)->startOfDay();
        $end = Carbon::today()->endOfDay();

        $donationQuery = DB::table('donations')
            ->whereBetween('created_at', [$start, $end]);

        if (!$includePending) {
            $donationQuery->whereNotIn('status', ['pending']);
        }

        $donationVolume = (float) (clone $donationQuery)->sum('amount');
        $materialDonationCount = (int) (clone $donationQuery)
            ->where('donation_type', 'material')
            ->count();
        $activeCampaigns = (int) DB::table('campaigns')
            ->when(
                Schema::hasColumn('campaigns', 'status'),
                fn ($query) => $query->where(function ($nested) {
                    $nested->whereNull('status')
                        ->orWhere('status', 'active');
                })
            )
            ->count();

        $avgPickupHours = (float) DB::table('material_pickups')
            ->join('donations', 'donations.id', '=', 'material_pickups.donation_id')
            ->whereNotNull('material_pickups.schedule_date')
            ->selectRaw('AVG(TIMESTAMPDIFF(HOUR, donations.created_at, material_pickups.schedule_date)) as avg_hours')
            ->value('avg_hours');

        $previousStart = $start->copy()->subDays($days);
        $previousEnd = $start->copy()->subDay()->endOfDay();

        $previousDonationQuery = DB::table('donations')
            ->whereBetween('created_at', [$previousStart, $previousEnd]);

        if (!$includePending) {
            $previousDonationQuery->whereNotIn('status', ['pending']);
        }

        $previousDonationVolume = (float) (clone $previousDonationQuery)->sum('amount');
        $previousMaterialDonationCount = (int) (clone $previousDonationQuery)
            ->where('donation_type', 'material')
            ->count();

        $previousOrganizationCount = (int) DB::table('organizations')
            ->whereBetween('created_at', [$previousStart, $previousEnd])
            ->count();
        $organizationCount = (int) DB::table('organizations')
            ->whereBetween('created_at', [$start, $end])
            ->count();

        $previousCampaignCount = $this->countCampaignsBetween($previousStart, $previousEnd);
        $campaignCount = $this->countCampaignsBetween($start, $end);

        $topCampaigns = DB::table('campaigns')
            ->leftJoin('organizations', 'organizations.id', '=', 'campaigns.organization_id')
            ->select(
                'campaigns.id',
                'campaigns.title as name',
                'campaigns.current_amount as raised',
                'campaigns.goal_amount as goal',
                'campaigns.status',
                'organizations.name as organization_name'
            )
            ->orderByDesc('campaigns.current_amount')
            ->limit(5)
            ->get()
            ->map(function ($row) {
                $goal = max((float) ($row->goal ?? 0), 0.01);
                $raised = (float) ($row->raised ?? 0);
                $ratio = $raised / $goal;

                if ($ratio >= 0.8) {
                    $status = 'On Track';
                } elseif ($ratio >= 0.45) {
                    $status = 'At Risk';
                } else {
                    $status = 'Delayed';
                }

                return [
                    'id' => (int) $row->id,
                    'name' => $row->name ?: 'Untitled Campaign',
                    'org' => $row->organization_name ?: 'Unknown Organization',
                    'raised' => $raised,
                    'goal' => (float) ($row->goal ?? 0),
                    'status' => $status,
                    'growth' => sprintf('%d%% funded', (int) round(min(999, $ratio * 100))),
                ];
            })
            ->values();

        $categoryBreakdown = DB::table('organizations')
            ->join('categories', 'categories.id', '=', 'organizations.category_id')
            ->select('categories.category_name as label', DB::raw('COUNT(*) as total'))
            ->groupBy('categories.category_name')
            ->orderByDesc('total')
            ->limit(5)
            ->get();

        $categoryTotal = max(1, (int) $categoryBreakdown->sum('total'));
        $categoryBreakdown = $categoryBreakdown
            ->map(fn ($row) => [
                'label' => $row->label,
                'value' => (int) round(((int) $row->total / $categoryTotal) * 100),
            ])
            ->values();

        return response()->json([
            'meta' => [
                'days' => $days,
                'start_date' => $start->toDateString(),
                'end_date' => $end->toDateString(),
            ],
            'kpis' => [
                [
                    'id' => 'donations',
                    'label' => 'Donation Volume',
                    'value' => $donationVolume,
                    'change' => $this->formatChange($previousDonationVolume, $donationVolume),
                    'note' => "Last {$days} Days",
                    'tone' => $donationVolume >= $previousDonationVolume ? 'success' : 'warning',
                ],
                [
                    'id' => 'items',
                    'label' => 'Material Donations',
                    'value' => $materialDonationCount,
                    'change' => $this->formatChange($previousMaterialDonationCount, $materialDonationCount),
                    'note' => 'Donation rows with material type',
                    'tone' => 'info',
                ],
                [
                    'id' => 'campaigns',
                    'label' => 'Active Campaigns',
                    'value' => $activeCampaigns,
                    'change' => $this->formatChange($previousCampaignCount, $campaignCount),
                    'note' => 'Campaigns marked active',
                    'tone' => 'warning',
                ],
                [
                    'id' => 'resolution',
                    'label' => 'Avg. Pickup Lead Time',
                    'value' => round($avgPickupHours, 1),
                    'change' => null,
                    'note' => 'Hours from donation to scheduled pickup',
                    'tone' => 'neutral',
                ],
            ],
            'series' => $this->buildSeries($days, $start, $end, $includePending),
            'category_breakdown' => $categoryBreakdown,
            'top_campaigns' => $topCampaigns,
            'placeholders' => [
                'geographic_impact' => 'Example only until geographic/location analytics are stored in the database.',
                'operational_alerts' => 'Example only until alert rules or SLA events are stored in the database.',
                'refund_filter' => 'Example only until refunds are represented in the database schema.',
            ],
            'examples' => [
                'alerts' => [
                    [
                        'title' => 'Spike in refund requests',
                        'description' => 'Example card. Requires refund records or a dedicated refund status history source.',
                        'tone' => 'warning',
                        'time' => 'Example',
                    ],
                    [
                        'title' => 'Delayed pickup tickets',
                        'description' => 'Example card. Real data should come from SLA or overdue pickup logic in the backend.',
                        'tone' => 'danger',
                        'time' => 'Example',
                    ],
                    [
                        'title' => 'High conversion campaign',
                        'description' => 'Example card. Real data should come from campaign visit-to-donation analytics.',
                        'tone' => 'success',
                        'time' => 'Example',
                    ],
                ],
            ],
        ]);
    }

    public function index(): JsonResponse
    {
        return response()->json(Report::query()->orderByDesc('id')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $record = Report::create($request->all());

        return response()->json($record, 201);
    }

    public function show(int $id): JsonResponse
    {
        $record = Report::findOrFail($id);

        return response()->json($record);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $record = Report::findOrFail($id);
        $record->update($request->all());

        return response()->json($record);
    }

    public function destroy(int $id): JsonResponse
    {
        $record = Report::findOrFail($id);
        $record->delete();

        return response()->json(null, 204);
    }

    private function buildSeries(
        int $days,
        Carbon $start,
        Carbon $end,
        bool $includePending
    ): array {
        $labels = [];
        $donors = [];
        $organizations = [];
        $campaigns = [];

        if ($days === 30) {
            $cursor = $start->copy()->startOfMonth();
            $seriesStart = $cursor->copy();
            $seriesEnd = $end->copy()->endOfMonth();
            while ($cursor->lte($seriesEnd)) {
                $monthStart = $cursor->copy()->startOfMonth();
                $monthEnd = $cursor->copy()->endOfMonth();
                $labels[] = $cursor->format('M');
                $donors[] = (int) $this->countDonationsBetween($monthStart, $monthEnd, $includePending);
                $organizations[] = (int) DB::table('organizations')->whereBetween('created_at', [$monthStart, $monthEnd])->count();
                $campaigns[] = $this->countCampaignsBetween($monthStart, $monthEnd);
                $cursor->addMonth();
            }
        } else {
            for ($date = $start->copy(); $date->lte($end); $date->addDay()) {
                $dayStart = $date->copy()->startOfDay();
                $dayEnd = $date->copy()->endOfDay();
                $labels[] = $days === 7 ? $date->format('D') : $date->format('M j');
                $donors[] = (int) $this->countDonationsBetween($dayStart, $dayEnd, $includePending);
                $organizations[] = (int) DB::table('organizations')->whereBetween('created_at', [$dayStart, $dayEnd])->count();
                $campaigns[] = $this->countCampaignsBetween($dayStart, $dayEnd);
            }
        }

        return [
            'labels' => $labels,
            'donors' => $donors,
            'organizations' => $organizations,
            'campaigns' => $campaigns,
        ];
    }

    private function countDonationsBetween(Carbon $start, Carbon $end, bool $includePending): int
    {
        $query = DB::table('donations')->whereBetween('created_at', [$start, $end]);
        if (!$includePending) {
            $query->whereNotIn('status', ['pending']);
        }

        return (int) $query->count();
    }

    private function countCampaignsBetween(Carbon $start, Carbon $end): int
    {
        if (Schema::hasColumn('campaigns', 'created_at')) {
            return (int) DB::table('campaigns')->whereBetween('created_at', [$start, $end])->count();
        }

        if (Schema::hasColumn('campaigns', 'start_date')) {
            return (int) DB::table('campaigns')->whereBetween('start_date', [$start->toDateString(), $end->toDateString()])->count();
        }

        return 0;
    }

    private function formatChange(float|int $previousValue, float|int $currentValue): ?string
    {
        $previousValue = (float) $previousValue;
        $currentValue = (float) $currentValue;

        if ($previousValue <= 0.0) {
            if ($currentValue <= 0.0) {
                return null;
            }

            return '+100%';
        }

        $delta = (($currentValue - $previousValue) / $previousValue) * 100;

        return sprintf('%+.1f%%', $delta);
    }
}
