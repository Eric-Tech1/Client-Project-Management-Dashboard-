<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('client_name');
            $table->text('description')->nullable();
            $table->date('start_date');
            $table->date('due_date');
            $table->string('status', 30)->default('not_started')->index();
            $table->timestamps();
            $table->index('client_name');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};
