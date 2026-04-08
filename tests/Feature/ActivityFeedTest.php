<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Schema;

describe('ActivityFeed', function (): void {
    it('has activity_feed table with correct columns', function (): void {
        expect(Schema::hasTable('activity_feed'))->toBeTrue();
        expect(Schema::hasColumns('activity_feed', [
            'id', 'type', 'actor_id', 'actor_snapshot',
            'subject_id', 'subject_snapshot', 'occurred_at', 'created_at',
        ]))->toBeTrue();
    });
});
