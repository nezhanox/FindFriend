<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\UserLocation;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin UserLocation
 */
class UserLocationResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray($request): array
    {
        return [
            'lat' => $this->lat,
            'lng' => $this->lng,
            'address' => $this->address,
            'is_visible' => $this->is_visible,
            'last_updated' => $this->last_updated,
            'user' => UserResource::make($this->whenLoaded('user')),
        ];
    }
}
