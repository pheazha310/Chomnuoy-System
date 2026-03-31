<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Campaign;
use App\Models\Donation;
use App\Models\Payment;
use App\Models\PaymentMethod;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Services\KHQRService;
use Illuminate\Support\Facades\Log;
use App\Models\Notification;
use App\Models\User;
use App\Models\Role;
use Illuminate\Support\Facades\Schema;

class PaymentController extends Controller
{
    private const PAYMENT_EXPIRY_MINUTES = 5;
    private const MIN_USD_AMOUNT = 0.001;
    
    protected KHQRService $khqrService;

    public function __construct(KHQRService $khqrService)
    {
        $this->khqrService = $khqrService;
    }

    private function paymentsHaveUserIdColumn(): bool
    {
        return Schema::hasTable('payments') && Schema::hasColumn('payments', 'user_id');
    }

    private function paymentColumns(): array
    {
        static $columns = null;

        if ($columns !== null) {
            return $columns;
        }

        return $columns = Schema::hasTable('payments')
            ? array_flip(Schema::getColumnListing('payments'))
            : [];
    }

    private function buildCheckoutPayload(Payment $payment, string $paymentLabel = 'Bakong KHQR'): array
    {
        $deepLinkResponse = $this->khqrService->generateDeepLink($payment->qr_code);
        $deepLink = $deepLinkResponse['deep_link']
            ?? $deepLinkResponse['deep_links']['bakong']
            ?? '';

        return [
            'mode' => 'qr',
            'expires_at' => optional($payment->expires_at)->toISOString(),
            'qr' => [
                'image' => '',
                'string' => $payment->qr_code,
                'deeplink' => $deepLink,
                'checkout_url' => '',
                'amount' => (float) $payment->amount,
                'currency' => $payment->currency,
            ],
            'meta' => [
                'environment' => app()->environment('production') ? 'production' : 'sandbox',
                'payment_option' => 'bakong_khqr',
                'payment_label' => $paymentLabel,
                'bill_number' => $payment->bill_number,
            ],
        ];
    }

    private function createPendingDonationIfNeeded(array $validated): ?Donation
    {
        $organizationId = !empty($validated['organization_id'])
            ? (int) $validated['organization_id']
            : null;

        if (!$organizationId && !empty($validated['campaign_id'])) {
            $organizationId = Campaign::query()
                ->whereKey((int) $validated['campaign_id'])
                ->value('organization_id');
        }

        if (empty($validated['user_id']) || empty($organizationId)) {
            return null;
        }

        return Donation::create([
            'user_id' => (int) $validated['user_id'],
            'organization_id' => (int) $organizationId,
            'campaign_id' => !empty($validated['campaign_id']) ? (int) $validated['campaign_id'] : null,
            'amount' => $validated['amount'],
            'donation_type' => 'money',
            'status' => 'pending',
        ]);
    }

    private function syncPaymentStatus(Payment $payment): Payment
    {
        if ($payment->status === 'SUCCESS') {
            return $payment;
        }

        if ($payment->isExpired()) {
            $payment->markAsExpired();
            return $payment->fresh();
        }

        $result = $this->khqrService->checkPayment($payment->md5);
        $payment->incrementCheckAttempts();

        Log::info('Payment sync check', [
            'payment_id' => $payment->id,
            'md5' => $payment->md5,
            'bakong_response' => $result,
        ]);

        $responseCode = $result['responseCode'] ?? -1;
        $isSuccess = $responseCode === 0;

        if ($isSuccess) {
            $txInfo = $this->khqrService->getPayment($payment->md5);
            $transactionId = $txInfo['data']['hash'] ??
                $result['data']['hash'] ??
                null;

            $payment->markAsSuccess($result, $transactionId);

            // Send notifications to organization and admin roles (not donor)
            $updatedPayment = $payment->fresh();
            if ($updatedPayment->status === 'SUCCESS') {
                $recipientRoles = ['Organization', 'Admin'];
                $usersToNotify = User::whereIn('role_id', Role::whereIn('role_name', $recipientRoles)->pluck('id'))->get();

                foreach ($usersToNotify as $recipient) {
                    Notification::create([
                        'user_id' => $recipient->id,
                        'message' => sprintf('A payment of $%s has been completed and needs your review.', number_format($updatedPayment->amount, 2)),
                        'type' => 'payment-received',
                    ]);
                }
            }
        }

        return $payment->fresh();
    }

    public function index(): JsonResponse
    {
        return response()->json(Payment::query()->orderByDesc('id')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $record = Payment::create($request->all());

        return response()->json($record, 201);
    }

    public function show(int $id): JsonResponse
    {
        $record = Payment::findOrFail($id);

        return response()->json($record);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $record = Payment::findOrFail($id);
        $record->update($request->all());

        return response()->json($record);
    }

    public function destroy(int $id): JsonResponse
    {
        $record = Payment::findOrFail($id);
        $record->delete();

        return response()->json(null, 204);
    }


    /**
     * Generate KHQR for payment
     */
    public function generateQR(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:' . self::MIN_USD_AMOUNT,
            'currency' => 'in:USD,KHR',
            'user_id' => 'nullable|integer|exists:users,id',
            'bill_number' => 'nullable|string',
            'mobile_number' => 'nullable|string',
            'store_label' => 'nullable|string',
            'terminal_label' => 'nullable|string',
            'type' => 'in:individual,merchant',
        ]);

        $type = $validated['type'] ?? 'individual';

        try {
            $result = $type === 'merchant'
                ? $this->khqrService->generateMerchantQR($validated)
                : $this->khqrService->generateIndividualQR($validated);

            if (isset($result['error'])) {
                Log::error('QR generation error', ['error' => $result['error']]);
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to generate QR: ' . $result['error'],
                ], 400);
            }

            if (!isset($result['data'])) {
                Log::error('Invalid QR service response', ['result' => $result]);
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid response from QR service',
                ], 500);
            }

            // Save payment to database
            $paymentPayload = [
                'md5' => $result['data']['md5'],
                'qr_code' => $result['data']['qr'],
                'amount' => $validated['amount'],
                'currency' => $validated['currency'] ?? 'USD',
                'bill_number' => $validated['bill_number'] ?? null,
                'mobile_number' => $validated['mobile_number'] ?? null,
                'store_label' => $validated['store_label'] ?? null,
                'terminal_label' => $validated['terminal_label'] ?? null,
                'merchant_name' => config('services.bakong.merchant.name'),
                'status' => 'PENDING',
                'expires_at' => now()->addMinutes(self::PAYMENT_EXPIRY_MINUTES),
            ];
            if ($this->paymentsHaveUserIdColumn()) {
                $paymentPayload['user_id'] = $validated['user_id'] ?? null;
            }

            $payment = Payment::create($paymentPayload);

            Log::info('Payment created', [
                'payment_id' => $payment->id,
                'md5' => $payment->md5,
                'amount' => $payment->amount,
                'currency' => $payment->currency
            ]);

            return response()->json([
                'success' => true,
                'qr_code' => $result['data']['qr'],
                'md5' => $result['data']['md5'],
                'payment_id' => $payment->id,
                'expires_at' => $payment->expires_at->toISOString(),
                'message' => 'QR generated successfully',
            ]);
        } catch (\Exception $e) {
            Log::error('Exception in generateQR', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function createBakongTransaction(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:' . self::MIN_USD_AMOUNT,
            'currency' => 'nullable|in:USD,KHR',
            'user_id' => 'nullable|integer|exists:users,id',
            'organization_id' => 'nullable|integer|exists:organizations,id',
            'campaign_id' => 'nullable|integer|exists:campaigns,id',
            'customer_name' => 'nullable|string|max:255',
            'customer_email' => 'nullable|email|max:255',
            'customer_phone' => 'nullable|string|max:50',
            'message' => 'nullable|string|max:1000',
        ]);

        $qrRequest = [
            'amount' => $validated['amount'],
            'currency' => $validated['currency'] ?? 'USD',
            'bill_number' => sprintf(
                'DON-%s-%s',
                $validated['campaign_id'] ?? ($validated['organization_id'] ?? 'ORG'),
                round(microtime(true) * 1000)
            ),
            'mobile_number' => $validated['customer_phone'] ?? null,
            'store_label' => 'Chomnuoy Donation',
            'terminal_label' => 'Online Donation',
            'type' => 'individual',
        ];

        if ($this->paymentsHaveUserIdColumn()) {
            $qrRequest['user_id'] = $validated['user_id'] ?? null;
        }

        try {
            $result = $this->khqrService->generateIndividualQR($qrRequest);

            if (isset($result['error'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to start Bakong KHQR checkout.',
                    'error' => $result['error'],
                ], 500);
            }

            if (!isset($result['data'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid response from QR service',
                ], 500);
            }

            $donation = $this->createPendingDonationIfNeeded($validated);
            $paymentMethod = PaymentMethod::query()->firstOrCreate([
                'method_name' => 'Bakong KHQR',
            ]);
            $paymentColumns = $this->paymentColumns();

            if (isset($paymentColumns['donation_id']) && !$donation) {
                return response()->json([
                    'success' => false,
                    'message' => 'A donor session and campaign organization are required before generating a QR payment.',
                    'errors' => [
                        'donation_id' => [
                            'Unable to create the donation record required for this payment.',
                        ],
                    ],
                ], 422);
            }

            $paymentPayload = [
                'md5' => $result['data']['md5'],
                'qr_code' => $result['data']['qr'],
                'amount' => $qrRequest['amount'],
                'currency' => $qrRequest['currency'],
                'bill_number' => $qrRequest['bill_number'],
                'mobile_number' => $qrRequest['mobile_number'],
                'store_label' => $qrRequest['store_label'],
                'terminal_label' => $qrRequest['terminal_label'],
                'merchant_name' => config('services.bakong.merchant.name'),
                'status' => 'PENDING',
                'expires_at' => now()->addMinutes(self::PAYMENT_EXPIRY_MINUTES),
            ];
            if ($this->paymentsHaveUserIdColumn()) {
                $paymentPayload['user_id'] = $validated['user_id'] ?? null;
            }
            if (isset($paymentColumns['donation_id'])) {
                $paymentPayload['donation_id'] = $donation?->id;
            }
            if (isset($paymentColumns['payment_method_id'])) {
                $paymentPayload['payment_method_id'] = $paymentMethod->id;
            }
            if (isset($paymentColumns['transaction_reference'])) {
                $paymentPayload['transaction_reference'] = $qrRequest['bill_number'];
            }
            if (isset($paymentColumns['payment_status'])) {
                $paymentPayload['payment_status'] = 'pending';
            }

            $payment = Payment::create($paymentPayload)->fresh();

            return response()->json([
                'success' => true,
                'transaction' => [
                    'tran_id' => $payment->id,
                    'status' => strtolower((string) $payment->status),
                    'md5' => $payment->md5,
                ],
                'donation' => $donation,
                'checkout' => $this->buildCheckoutPayload($payment),
            ]);
        } catch (\Exception $e) {
            Log::error('Exception in createBakongTransaction', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function verifyBakongTransaction(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'tranId' => 'required|integer|exists:payments,id',
            'user_id' => 'nullable|integer|exists:users,id',
        ]);

        $payment = Payment::findOrFail($validated['tranId']);
        $payment = $this->syncPaymentStatus($payment);
        $payment = $this->attachUserIfMissing($payment, $validated['user_id'] ?? null);

        return response()->json([
            'success' => true,
            'transaction' => [
                'tran_id' => $payment->id,
                'status' => strtolower((string) $payment->status),
                'amount' => $payment->amount,
                'currency' => $payment->currency,
                'transaction_id' => $payment->transaction_id,
                'md5' => $payment->md5,
                'paid_at' => $payment->paid_at,
                'expires_at' => $payment->expires_at,
            ],
        ]);
    }

    /**
     * Check payment status
     */
    public function checkPayment(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'md5' => 'required|string',
            'user_id' => 'nullable|integer|exists:users,id',
        ]);

        $payment = Payment::where('md5', $validated['md5'])->first();

        if (!$payment) {
            return response()->json([
                'success' => false,
                'message' => 'Payment not found',
            ], 404);
        }

        $payment = $this->syncPaymentStatus($payment);
        $payment = $this->attachUserIfMissing($payment, $validated['user_id'] ?? null);

        if ($payment->status === 'SUCCESS') {
            return response()->json([
                'success' => true,
                'status' => 'SUCCESS',
                'message' => 'Payment already completed!',
                'data' => [
                    'amount' => $payment->amount,
                    'currency' => $payment->currency,
                    'paid_at' => $payment->paid_at,
                    'transaction_id' => $payment->transaction_id,
                ],
            ]);
        }

        if ($payment->status === 'EXPIRED') {
            return response()->json([
                'success' => false,
                'status' => 'EXPIRED',
                'message' => 'Payment has expired',
            ]);
        }

        return response()->json([
            'success' => false,
            'status'  => 'PENDING',
            'message' => 'Payment not yet completed',
            'data'    => [
                'check_attempts'  => $payment->check_attempts,
                'last_checked_at' => $payment->last_checked_at,
                'expires_at'      => $payment->expires_at,
            ],
        ]);
    }

    /**
     * Get payment status by ID
     */
    public function getPaymentStatus(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'payment_id' => 'required|integer|exists:payments,id',
            'user_id' => 'nullable|integer|exists:users,id',
        ]);

        $payment = Payment::findOrFail($validated['payment_id']);
        $payment = $this->syncPaymentStatus($payment);
        $payment = $this->attachUserIfMissing($payment, $validated['user_id'] ?? null);

        return response()->json([
            'success' => true,
            'payment' => [
                'id' => $payment->id,
                'user_id' => $payment->user_id,
                'md5' => $payment->md5,
                'amount' => $payment->amount,
                'currency' => $payment->currency,
                'status' => $payment->status,
                'created_at' => $payment->created_at,
                'expires_at' => $payment->expires_at,
                'paid_at' => $payment->paid_at,
                'check_attempts' => $payment->check_attempts,
                'last_checked_at' => $payment->last_checked_at,
                'telegram_sent' => $payment->telegram_sent,
            ],
        ]);
    }

    /**
     * Verify QR code
     */
    public function verifyQR(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'qr_code' => 'required|string',
        ]);

        $result = $this->khqrService->verifyQR($validated['qr_code']);

        return response()->json($result);
    }

    /**
     * Decode QR code
     */
    public function decodeQR(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'qr_code' => 'required|string',
        ]);

        $result = $this->khqrService->decodeQR($validated['qr_code']);

        return response()->json($result);
    }

    /**
     * Generate deep link
     */
    public function generateDeepLink(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'qr_code' => 'required|string',
        ]);

        $result = $this->khqrService->generateDeepLink($validated['qr_code']);

        return response()->json($result);
    }

    private function attachUserIfMissing(Payment $payment, ?int $userId = null): Payment
    {
        if (!$this->paymentsHaveUserIdColumn()) {
            return $payment;
        }

        if (!$userId || $payment->user_id) {
            return $payment;
        }

        $payment->update(['user_id' => $userId]);

        return $payment->fresh();
    }


}
