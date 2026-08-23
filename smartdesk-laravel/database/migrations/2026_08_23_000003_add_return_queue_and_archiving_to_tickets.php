<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->unsignedBigInteger('returnedto')->nullable();
            $table->softDeletes();
            $table->foreign('returnedto')->references('id')->on('users')->nullOnDelete();
            $table->index(['statusid', 'creation_date']);
            $table->index(['assignedto', 'creation_date']);
        });
    }

    public function down(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->dropForeign(['returnedto']);
            $table->dropIndex(['statusid', 'creation_date']);
            $table->dropIndex(['assignedto', 'creation_date']);
            $table->dropColumn('returnedto');
            $table->dropSoftDeletes();
        });
    }
};
