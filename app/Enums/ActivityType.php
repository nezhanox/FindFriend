<?php

declare(strict_types=1);

namespace App\Enums;

enum ActivityType: string
{
    case FriendshipAccepted = 'friendship_accepted';
    case FriendRequestSent = 'friend_request_sent';
    case MessageSent = 'message_sent';
    case UserJoined = 'user_joined';

    public function label(): string
    {
        return match ($this) {
            self::FriendshipAccepted => 'став(ла) друзями',
            self::FriendRequestSent => 'надіслав(ла) запрошення',
            self::MessageSent => 'написав(ла) повідомлення',
            self::UserJoined => 'приєднався(лась) до FindFriend',
        };
    }
}
