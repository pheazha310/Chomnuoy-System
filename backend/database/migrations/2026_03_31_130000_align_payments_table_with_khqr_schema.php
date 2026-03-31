<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('payments')) {
            return;
        }

        Schema::table('payments', function (Blueprint $table) {
            if (!Schema::hasColumn('payments', 'md5')) {
                $table->string('md5', 32)->nullable()->after('user_id');
            }
            if (!Schema::hasColumn('payments', 'qr_code')) {
                $table->text('qr_code')->nullable()->after('md5');
            }
            if (!Schema::hasColumn('payments', 'currency')) {
                $table->string('currency', 3)->default('USD')->after('amount');
            }
            if (!Schema::hasColumn('payments', 'bill_number')) {
                $table->string('bill_number')->nullable()->after('currency');
            }
            if (!Schema::hasColumn('payments', 'mobile_number')) {
                $table->string('mobile_number')->nullable()->after('bill_number');
            }
            if (!Schema::hasColumn('payments', 'store_label')) {
                $table->string('store_label')->nullable()->after('mobile_number');
            }
            if (!Schema::hasColumn('payments', 'terminal_label')) {
                $table->string('terminal_label')->nullable()->after('store_label');
            }
            if (!Schema::hasColumn('payments', 'merchant_name')) {
                $table->string('merchant_name')->nullable()->after('terminal_label');
            }
            if (!Schema::hasColumn('payments', 'status')) {
                $table->string('status', 20)->default('PENDING')->after('merchant_name');
            }
            if (!Schema::hasColumn('payments', 'bakong_response')) {
                $table->json('bakong_response')->nullable()->after('status');
            }
            if (!Schema::hasColumn('payments', 'transaction_id')) {
                $table->string('transaction_id')->nullable()->after('bakong_response');
            }
            if (!Schema::hasColumn('payments', 'expires_at')) {
                $table->timestamp('expires_at')->nullable()->after('transaction_id');
            }
            if (!Schema::hasColumn('payments', 'paid_at')) {
                $table->timestamp('paid_at')->nullable()->after('expires_at');
            }
            if (!Schema::hasColumn('payments', 'telegram_sent')) {
                $table->boolean('telegram_sent')->default(false)->after('paid_at');
            }
            if (!Schema::hasColumn('payments', 'check_attempts')) {
                $table->integer('check_attempts')->default(0)->after('telegram_sent');
            }
            if (!Schema::hasColumn('payments', 'last_checked_at')) {
                $table->timestamp('last_checked_at')->nullable()->after('check_attempts');
            }
            if (!Schema::hasColumn('payments', 'updated_at')) {
                $table->timestamp('updated_at')->nullable()->after('created_at');
            }
        });

        if (Schema::hasColumn('payments', 'payment_status')) {
            DB::statement("
                UPDATE payments
                SET status = CASE LOWER(COALESCE(payment_status, ''))
                    WHEN 'success' THEN 'SUCCESS'
                    WHEN 'completed' THEN 'SUCCESS'
                    WHEN 'paid' THEN 'SUCCESS'
                    WHEN 'failed' THEN 'FAILED'
                    WHEN 'expire' THEN 'EXPIRED'
                    WHEN 'expired' THEN 'EXPIRED'
                    ELSE COALESCE(status, 'PENDING')
                END
                WHERE status IS NULL OR status = '' OR status = 'PENDING'
            ");
        }

        if (!Schema::hasColumn('payments', 'md5')) {
            return;
        }

        if (!Schema::hasColumn('payments', 'bill_number')) {
            return;
        }

        Schema::table('payments', function (Blueprint $table) {
            try {
                $table->index(['status', 'expires_at'], 'payments_status_expires_at_idx');
            } catch (\Throwable $e) {
                // Ignore if index already exists.
            }

            try {
                $table->index(['status', 'last_checked_at'], 'payments_status_last_checked_at_idx');
            } catch (\Throwable $e) {
                // Ignore if index already exists.
            }
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('payments')) {
            return;
        }

        Schema::table('payments', function (Blueprint $table) {
            foreach (['payments_status_expires_at_idx', 'payments_status_last_checked_at_idx'] as $indexName) {
                try {
                    $table->dropIndex($indexName);
                } catch (\Throwable $e) {
                    // Ignore if index does not exist.
                }
            }

            $dropColumns = [
                'md5',
                'qr_code',
                'currency',
                'bill_number',
                'mobile_number',
                'store_label',
                'terminal_label',
                'merchant_name',
                'status',
                'bakong_response',
                'transaction_id',
                'expires_at',
                'paid_at',
                'telegram_sent',
                'check_attempts',
                'last_checked_at',
                'updated_at',
            ];

            $existing = array_values(array_filter($dropColumns, fn ($column) => Schema::hasColumn('payments', $column)));
            if (count($existing) > 0) {
                $table->dropColumn($existing);
            }
        });
    }
};
