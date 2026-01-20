<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('friendships', function (Blueprint $table): void {
            $table->enum('status', ['pending', 'accepted', 'rejected'])
                ->default('pending')
                ->after('friend_id');
            $table->softDeletes();

            // Add index for status queries
            $table->index(['user_id', 'status']);
            $table->index(['friend_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::table('friendships', function (Blueprint $table): void {
            $table->dropIndex(['user_id', 'status']);
            $table->dropIndex(['friend_id', 'status']);
            $table->dropSoftDeletes();
            $table->dropColumn('status');
        });
    }
};
