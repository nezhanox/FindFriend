<?php

declare(strict_types=1);

namespace App\Http\Requests\Friendship;

use Illuminate\Foundation\Http\FormRequest;

class SendFriendRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'friend_id' => ['required', 'integer', 'exists:users,id'],
        ];
    }
}
