<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('payments')) {
            return;
        }

        // Drop legacy foreign keys before altering nullability.
        try {
            DB::statement('ALTER TABLE `payments` DROP FOREIGN KEY `payments_donation_id_foreign`');
        } catch (\Throwable $e) {
            // Ignore when foreign key is not present.
        }

        try {
            DB::statement('ALTER TABLE `payments` DROP FOREIGN KEY `payments_payment_method_id_foreign`');
        } catch (\Throwable $e) {
            // Ignore when foreign key is not present.
        }

        DB::statement('ALTER TABLE `payments` MODIFY `donation_id` BIGINT UNSIGNED NULL');
        DB::statement('ALTER TABLE `payments` MODIFY `payment_method_id` BIGINT UNSIGNED NULL');

        DB::statement('
            ALTER TABLE `payments`
            ADD CONSTRAINT `payments_donation_id_foreign`
            FOREIGN KEY (`donation_id`) REFERENCES `donations`(`id`)
            ON UPDATE CASCADE ON DELETE SET NULL
        ');

        DB::statement('
            ALTER TABLE `payments`
            ADD CONSTRAINT `payments_payment_method_id_foreign`
            FOREIGN KEY (`payment_method_id`) REFERENCES `payment_methods`(`id`)
            ON UPDATE CASCADE ON DELETE SET NULL
        ');
    }

    public function down(): void
    {
        if (!Schema::hasTable('payments')) {
            return;
        }

        try {
            DB::statement('ALTER TABLE `payments` DROP FOREIGN KEY `payments_donation_id_foreign`');
        } catch (\Throwable $e) {
            // Ignore when foreign key is not present.
        }

        try {
            DB::statement('ALTER TABLE `payments` DROP FOREIGN KEY `payments_payment_method_id_foreign`');
        } catch (\Throwable $e) {
            // Ignore when foreign key is not present.
        }

        DB::statement('ALTER TABLE `payments` MODIFY `donation_id` BIGINT UNSIGNED NOT NULL');
        DB::statement('ALTER TABLE `payments` MODIFY `payment_method_id` BIGINT UNSIGNED NOT NULL');

        DB::statement('
            ALTER TABLE `payments`
            ADD CONSTRAINT `payments_donation_id_foreign`
            FOREIGN KEY (`donation_id`) REFERENCES `donations`(`id`)
            ON UPDATE CASCADE ON DELETE CASCADE
        ');

        DB::statement('
            ALTER TABLE `payments`
            ADD CONSTRAINT `payments_payment_method_id_foreign`
            FOREIGN KEY (`payment_method_id`) REFERENCES `payment_methods`(`id`)
            ON UPDATE CASCADE ON DELETE RESTRICT
        ');
    }
};
