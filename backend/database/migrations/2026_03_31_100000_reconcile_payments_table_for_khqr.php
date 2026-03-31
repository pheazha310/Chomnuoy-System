<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('payments')) {
            return;
        }

        Schema::table('payments', function (Blueprint $table) {
            if (! Schema::hasColumn('payments', 'md5')) {
                $table->string('md5', 32)->nullable()->unique();
            }
            if (! Schema::hasColumn('payments', 'qr_code')) {
                $table->text('qr_code')->nullable();
            }
            if (! Schema::hasColumn('payments', 'currency')) {
                $table->string('currency', 3)->default('USD');
            }
            if (! Schema::hasColumn('payments', 'bill_number')) {
                $table->string('bill_number')->nullable();
            }
            if (! Schema::hasColumn('payments', 'mobile_number')) {
                $table->string('mobile_number')->nullable();
            }
            if (! Schema::hasColumn('payments', 'store_label')) {
                $table->string('store_label')->nullable();
            }
            if (! Schema::hasColumn('payments', 'terminal_label')) {
                $table->string('terminal_label')->nullable();
            }
            if (! Schema::hasColumn('payments', 'merchant_name')) {
                $table->string('merchant_name')->nullable();
            }
            if (! Schema::hasColumn('payments', 'status')) {
                $table->string('status', 20)->default('PENDING');
            }
            if (! Schema::hasColumn('payments', 'bakong_response')) {
                $table->json('bakong_response')->nullable();
            }
            if (! Schema::hasColumn('payments', 'transaction_id')) {
                $table->string('transaction_id')->nullable();
            }
            if (! Schema::hasColumn('payments', 'expires_at')) {
                $table->timestamp('expires_at')->nullable();
            }
            if (! Schema::hasColumn('payments', 'paid_at')) {
                $table->timestamp('paid_at')->nullable();
            }
            if (! Schema::hasColumn('payments', 'telegram_sent')) {
                $table->boolean('telegram_sent')->default(false);
            }
            if (! Schema::hasColumn('payments', 'check_attempts')) {
                $table->integer('check_attempts')->default(0);
            }
            if (! Schema::hasColumn('payments', 'last_checked_at')) {
                $table->timestamp('last_checked_at')->nullable();
            }
            if (! Schema::hasColumn('payments', 'created_at')) {
                $table->timestamp('created_at')->nullable();
            }
            if (! Schema::hasColumn('payments', 'updated_at')) {
                $table->timestamp('updated_at')->nullable();
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('payments')) {
            return;
        }

        Schema::table('payments', function (Blueprint $table) {
            $columns = [
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
            ];

            $droppable = array_values(array_filter($columns, fn (string $column) => Schema::hasColumn('payments', $column)));
            if ($droppable !== []) {
                $table->dropColumn($droppable);
            }
        });
    }
};
