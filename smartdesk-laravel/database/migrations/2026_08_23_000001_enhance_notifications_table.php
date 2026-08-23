<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->string('type', 60)->default('general');
            $table->string('action_url')->nullable();
            $table->timestamp('read_at')->nullable();
            $table->timestamp('email_sent_at')->nullable();
            $table->index(['userid', 'read_at']);
            $table->index(['userid', 'date']);
        });
    }

    public function down(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->dropIndex(['userid', 'read_at']);
            $table->dropIndex(['userid', 'date']);
            $table->dropColumn(['type', 'action_url', 'read_at', 'email_sent_at']);
        });
    }
};
