<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrganizationReportsController extends Controller
{
    public function transactions(Request $request): JsonResponse
    {
        $organizationId = $this->parseOrganizationId($request);
        $perPage = (int) $request->query('per_page', $request->query('limit', 10));
        $perPage = max(1, min($perPage, 50));
        $page = max(1, (int) $request->query('page', 1));
        $search = trim((string) $request->query('search', ''));
        $status = $request->query('status');
        $type = strtolower((string) $request->query('type', $request->query('donation_type', '')));

        $baseQuery = DB::table('donations')
            ->leftJoin('users', 'users.id', '=', 'donations.user_id')
            ->leftJoin('organizations', 'organizations.id', '=', 'donations.organization_id')
            ->leftJoin('payments', function ($join) {
                $join->on('payments.donation_id', '=', 'donations.id')
                    ->where('payments.payment_status', 'completed');
            })
            ->leftJoin('material_items', 'material_items.donation_id', '=', 'donations.id');

        if ($organizationId) {
            $baseQuery->where('donations.organization_id', $organizationId);
        }

        if ($status) {
            $baseQuery->where('donations.status', $status);
        }

        if ($type === 'financial') {
            $baseQuery->where('donations.donation_type', 'money');
        } elseif ($type === 'material') {
            $baseQuery->where('donations.donation_type', 'material');
        } elseif ($type) {
            $baseQuery->where('donations.donation_type', $type);
        }

        if ($search !== '') {
            $normalized = preg_replace('/^#?TXN-?/i', '', $search);
            $baseQuery->where(function ($query) use ($search, $normalized) {
                if (is_numeric($normalized)) {
                    $query->orWhere('donations.id', (int) $normalized);
                }
                $like = '%' . $search . '%';
                $query->orWhere('users.name', 'like', $like);
            });
        }

        $total = (clone $baseQuery)->distinct('donations.id')->count('donations.id');
        $lastPage = $total > 0 ? (int) ceil($total / $perPage) : 1;
        $offset = ($page - 1) * $perPage;

        $rows = (clone $baseQuery)
            ->select([
                'donations.id as donation_id',
                'donations.donation_type',
                'donations.amount as donation_amount',
                'donations.created_at as donation_date',
                'users.name as donor_name',
                'organizations.location as province',
                DB::raw('SUM(material_items.quantity) as material_units'),
                DB::raw('MAX(payments.amount) as payment_amount'),
            ])
            ->groupBy(
                'donations.id',
                'donations.donation_type',
                'donations.amount',
                'donations.created_at',
                'users.name',
                'organizations.location'
            )
            ->orderByDesc('donations.created_at')
            ->offset($offset)
            ->limit($perPage)
            ->get();

        $payload = $rows->map(function ($row) {
            $type = $row->donation_type === 'material' ? 'Material' : 'Financial';
            $materialUnits = (int) ($row->material_units ?? 0);
            $amountValue = $type === 'Financial'
                ? (float) ($row->payment_amount ?? $row->donation_amount ?? 0)
                : $materialUnits;

            return [
                'code' => 'TXN-' . $row->donation_id,
                'donor' => $row->donor_name ?? 'Unknown Donor',
                'type' => $type,
                'province' => $row->province ?? 'Unknown',
                'date' => $row->donation_date,
                'amount_value' => $amountValue,
                'material_units' => $materialUnits,
            ];
        });

        return response()->json([
            'data' => $payload,
            'meta' => [
                'total' => $total,
                'per_page' => $perPage,
                'current_page' => $page,
                'last_page' => $lastPage,
                'from' => $total > 0 ? min($offset + 1, $total) : 0,
                'to' => $total > 0 ? min($offset + $perPage, $total) : 0,
            ],
        ]);
    }

    private function parseOrganizationId(Request $request): ?int
    {
        $raw = $request->query('organization_id');

        return is_numeric($raw) ? (int) $raw : null;
    }
}
