<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray($request): array
    {
        /** @var User|JsonResource $this */

        return [
            'name' => $this->name,
            'email' => $this->email,
            'avatar' => $this->avatar,
            'age' => $this->age,
            'gender' => $this->gender,
            'last_seen_at' => $this->last_seen_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,

        ];
    }
}
