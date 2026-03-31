<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Campaign;
use App\Models\Donation;
use App\Models\DonationStatusHistory;
use App\Models\Payment;
use App\Models\PaymentMethod;
use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use KHQR\BakongKHQR;
use KHQR\Helpers\KHQRData;
use KHQR\Models\IndividualInfo;
use SimpleSoftwareIO\QrCode\Facades\QrCode;
use Throwable;

class BakongTransactionController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'organization_id' => ['nullable', 'integer', 'exists:organizations,id'],
            'campaign_id' => ['required', 'integer', 'exists:campaigns,id'],
            'amount' => ['required', 'numeric', 'min:1'],
            'customer_name' => ['nullable', 'string', 'max:255'],
            'customer_email' => ['nullable', 'email', 'max:255'],
            'customer_phone' => ['nullable', 'string', 'max:50'],
        ]);

        $payload = DB::transaction(function () use ($validated) {
            $campaign = Campaign::query()->findOrFail((int) $validated['campaign_id']);
            $organizationId = (int) ($validated['organization_id'] ?? $campaign->organization_id ?? 0);
            $amount = (float) $validated['amount'];
            $tranId = sprintf('BKG-%s', strtoupper(bin2hex(random_bytes(4))));
            $environment = (string) config('services.aba_payway.environment', 'sandbox');
            $qrPayload = $this->resolveKhqrPayload($campaign, $amount, $tranId);
            $currency = (string) ($qrPayload['currency'] ?? config('services.bakong.currency', 'USD'));

            $donation = Donation::create([
                'user_id' => (int) $validated['user_id'],
                'organization_id' => $organizationId,
                'campaign_id' => (int) $campaign->id,
                'amount' => $amount,
                'donation_type' => 'money',
                'status' => 'pending',
            ]);

            DonationStatusHistory::create([
                'donation_id' => $donation->id,
                'old_status' => 'created',
                'new_status' => 'pending',
            ]);

            $paymentMethod = PaymentMethod::query()->firstOrCreate([
                'method_name' => 'Bakong KHQR',
            ]);

            $payment = Payment::create([
                'donation_id' => $donation->id,
                'payment_method_id' => $paymentMethod->id,
                'transaction_reference' => $tranId,
                'amount' => $amount,
                'payment_status' => 'pending',
            ]);

            $transaction = Transaction::create([
                'user_id' => (int) $validated['user_id'],
                'organization_id' => $organizationId > 0 ? $organizationId : null,
                'campaign_id' => (int) $campaign->id,
                'donation_id' => $donation->id,
                'payment_id' => $payment->id,
                'tran_id' => $tranId,
                'amount' => $amount,
                'currency' => $currency,
                'payment_option' => (string) config('services.aba_payway.payment_option', 'abapay_khqr'),
                'status' => 'pending',
                'customer_name' => $validated['customer_name'] ?? null,
                'customer_email' => $validated['customer_email'] ?? null,
                'customer_phone' => $validated['customer_phone'] ?? null,
                'checkout_url' => null,
                'qr_string' => (string) ($qrPayload['string'] ?? ''),
                'deeplink' => (string) ($qrPayload['deeplink'] ?? ''),
                'request_payload' => $validated,
                'response_payload' => [
                    'qr_image' => (string) ($qrPayload['image'] ?? ''),
                    'qr_md5' => (string) ($qrPayload['md5'] ?? ''),
                    'qr_name' => (string) config('services.bakong.static_qr_name', 'Bakong KHQR'),
                ],
            ]);

            return [
                'donation' => $donation,
                'payment' => $payment,
                'transaction' => $transaction,
                'campaign' => $campaign,
                'environment' => $environment,
                'qr_payload' => $qrPayload,
            ];
        });

        return response()->json([
            'donation' => $payload['donation'],
            'payment' => $payload['payment'],
            'transaction' => [
                'id' => $payload['transaction']->id,
                'tran_id' => $payload['transaction']->tran_id,
                'status' => $payload['transaction']->status,
                'amount' => (float) $payload['transaction']->amount,
                'currency' => $payload['transaction']->currency,
            ],
            'checkout' => [
                'meta' => [
                    'environment' => $payload['environment'],
                    'payment_option' => $payload['transaction']->payment_option,
                    'payment_label' => 'Bakong KHQR',
                ],
                'qr' => [
                    'image' => (string) ($payload['qr_payload']['image'] ?? ''),
                    'string' => (string) ($payload['qr_payload']['string'] ?? ''),
                    'deeplink' => (string) ($payload['qr_payload']['deeplink'] ?? ''),
                    'checkout_url' => $payload['transaction']->checkout_url,
                    'app_store' => '',
                    'play_store' => '',
                    'amount' => (float) $payload['transaction']->amount,
                    'currency' => $payload['transaction']->currency,
                ],
            ],
        ], 201);
    }

    public function verify(string $tranId): JsonResponse
    {
        $transaction = Transaction::query()->where('tran_id', $tranId)->firstOrFail();
        $environment = (string) config('services.aba_payway.environment', 'sandbox');

        DB::transaction(function () use ($transaction, $environment) {
            if ($transaction->status !== 'pending') {
                return;
            }

            if ($environment !== 'sandbox') {
                return;
            }

            $transaction->update([
                'status' => 'completed',
                'paid_at' => Carbon::now(),
                'callback_payload' => ['verified_in' => 'sandbox'],
            ]);

            $payment = $transaction->payment_id ? Payment::query()->find($transaction->payment_id) : null;
            if ($payment) {
                $payment->update([
                    'payment_status' => 'completed',
                    'transaction_reference' => $transaction->tran_id,
                ]);
            }

            $donation = $transaction->donation_id ? Donation::query()->find($transaction->donation_id) : null;
            if ($donation && $donation->status !== 'completed') {
                $oldStatus = $donation->status ?: 'pending';
                $donation->update(['status' => 'completed']);
                DonationStatusHistory::create([
                    'donation_id' => $donation->id,
                    'old_status' => $oldStatus,
                    'new_status' => 'completed',
                ]);

                if ($donation->campaign_id) {
                    $campaign = Campaign::query()->find($donation->campaign_id);
                    if ($campaign) {
                        $campaign->increment('current_amount', (float) $donation->amount);
                    }
                }
            }
        });

        $freshTransaction = Transaction::query()->where('tran_id', $tranId)->firstOrFail();

        return response()->json([
            'transaction' => [
                'id' => $freshTransaction->id,
                'tran_id' => $freshTransaction->tran_id,
                'status' => $freshTransaction->status,
                'amount' => (float) $freshTransaction->amount,
                'currency' => $freshTransaction->currency,
                'donation_id' => $freshTransaction->donation_id,
                'paid_at' => optional($freshTransaction->paid_at)->toIso8601String(),
            ],
        ]);
    }

    private function resolveKhqrPayload(Campaign $campaign, float $amount, string $tranId): array
    {
        $staticPayload = $this->buildStaticQrPayload($amount);
        $bakongAccountId = trim((string) config('services.bakong.account_id', ''));

        if ($bakongAccountId === '') {
            if ($staticPayload !== null) {
                return $staticPayload;
            }

            throw ValidationException::withMessages([
                'bakong' => ['Bakong KHQR is not configured. Please set BAKONG_ACCOUNT_ID in backend .env.'],
            ]);
        }

        try {
            $currencyKey = strtoupper((string) config('services.bakong.currency', 'USD'));
            $currencyCode = $currencyKey === 'KHR' ? KHQRData::CURRENCY_KHR : KHQRData::CURRENCY_USD;
            $merchantName = Str::limit(
                trim((string) config('services.bakong.merchant_name', config('app.name', 'Chomnuoy System'))),
                25,
                ''
            );
            $merchantCity = Str::limit(
                trim((string) config('services.bakong.merchant_city', 'PHNOM PENH')),
                15,
                ''
            );
            $billNumber = Str::limit($tranId, 25, '');
            $storeLabel = Str::limit((string) ($campaign->title ?? 'Campaign Donation'), 25, '');

            $individualInfo = IndividualInfo::withOptionalArray(
                $bakongAccountId,
                $merchantName,
                $merchantCity,
                [
                    'currency' => $currencyCode,
                    'amount' => round($amount, 2),
                    'billNumber' => $billNumber,
                    'storeLabel' => $storeLabel,
                ]
            );

            $khqrResponse = BakongKHQR::generateIndividual($individualInfo);
            $statusCode = (int) data_get($khqrResponse, 'status.code', 1);
            $qrString = (string) data_get($khqrResponse, 'data.qr', '');

            if ($statusCode !== 0 || $qrString === '') {
                throw new \RuntimeException('Unable to generate KHQR payload.');
            }

            return [
                'image' => $this->buildQrImageDataUrl($qrString),
                'string' => $qrString,
                'deeplink' => '',
                'md5' => (string) data_get($khqrResponse, 'data.md5', md5($qrString)),
                'amount' => round($amount, 2),
                'currency' => $currencyKey,
            ];
        } catch (Throwable $exception) {
            if ($staticPayload !== null) {
                return $staticPayload;
            }

            throw ValidationException::withMessages([
                'bakong' => ['Failed to generate KHQR. Please check Bakong account settings and try again.'],
            ]);
        }
    }

    private function buildStaticQrPayload(float $amount): ?array
    {
        $image = trim((string) config('services.bakong.static_qr_image', ''));
        $string = trim((string) config('services.bakong.static_qr_string', ''));

        if ($image === '' && $string === '') {
            return null;
        }

        return [
            'image' => $image,
            'string' => $string,
            'deeplink' => (string) config('services.bakong.static_qr_deeplink', ''),
            'md5' => $string !== '' ? md5($string) : '',
            'amount' => round($amount, 2),
            'currency' => strtoupper((string) config('services.bakong.currency', 'USD')),
        ];
    }

    private function buildQrImageDataUrl(string $qrString): string
    {
        try {
            $pngBinary = QrCode::format('png')
                ->size(520)
                ->margin(1)
                ->errorCorrection('M')
                ->generate($qrString);

            return 'data:image/png;base64,' . base64_encode($pngBinary);
        } catch (Throwable) {
            // On environments without imagick, generate SVG instead of failing checkout.
            $svgMarkup = QrCode::format('svg')
                ->size(520)
                ->margin(1)
                ->errorCorrection('M')
                ->generate($qrString);

            return 'data:image/svg+xml;base64,' . base64_encode($svgMarkup);
        }
    }
}
