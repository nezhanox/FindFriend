<?php

declare(strict_types=1);

describe('Health Check', function (): void {
    it('returns ok status', function (): void {
        $response = $this->getJson('/health');

        $response->assertSuccessful()
            ->assertJson(['status' => 'ok']);
    });

    it('returns 200 status code', function (): void {
        $response = $this->get('/health');

        expect($response->status())->toBe(200);
    });
});
