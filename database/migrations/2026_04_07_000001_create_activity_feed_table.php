<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activity_feed', function (Blueprint $table): void {
            $table->ulid('id')->primary();
            $table->string('type', 50);
            $table->unsignedBigInteger('actor_id')->index();
            $table->json('actor_snapshot');
            $table->unsignedBigInteger('subject_id')->nullable()->index();
            $table->json('subject_snapshot')->nullable();
            $table->timestamp('occurred_at');
            $table->timestamp('created_at')->useCurrent();

            $table->index(['occurred_at']);
            $table->foreign('actor_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('subject_id')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_feed');
    }
};
