<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
         Schema::create('tickets_history', function (Blueprint $table) {

        $table->id();

        $table->unsignedBigInteger('ticketid');

        $table->unsignedBigInteger('assignedby');

        $table->unsignedBigInteger('assignedto');

        $table->timestamp('assigneddate');

        $table->text('reason');

        $table->foreign('ticketid')
              ->references('id')
              ->on('tickets')
              ->onDelete('cascade');

        $table->foreign('assignedby')
              ->references('id')
              ->on('users')
              ->onDelete('restrict');

        $table->foreign('assignedto')
              ->references('id')
              ->on('users')
              ->onDelete('restrict');
    });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tickets_history');
    }
};
