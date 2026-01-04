<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\Chat\CreateConversationAction;
use App\Actions\Chat\MarkMessagesAsReadAction;
use App\Actions\Chat\SendMessageAction;
use App\Http\Requests\SendMessageRequest;
use App\Models\Conversation;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MessageController extends Controller
{
    /**
     * Send a message in a conversation.
     */
    public function store(
        SendMessageRequest $request,
        CreateConversationAction $createConversation,
        SendMessageAction $sendMessage
    ): JsonResponse {
        /** @var User $user */
        $user = $request->user();
        $recipient = User::query()->findOrFail($request->validated('recipient_id'));

        // Get or create conversation
        $conversation = $createConversation->execute($user, $recipient);

        // Send message
        $message = $sendMessage->execute(
            $conversation,
            $user,
            $request->validated('content')
        );

        return response()->json([
            'id' => $message->getKey(),
            'conversation_id' => $message->conversation_id,
            'content' => $message->content,
            'created_at' => $message->created_at?->toISOString(),
        ], 201);
    }

    /**
     * Mark messages as read in a conversation.
     */
    public function markAsRead(
        Request $request,
        Conversation $conversation,
        MarkMessagesAsReadAction $markAsRead
    ): JsonResponse {
        /** @var User $user */
        $user = $request->user();

        // Authorize: user must be part of the conversation
        abort_unless(
            $conversation->user_id === $user->getKey() || $conversation->recipient_id === $user->getKey(),
            403,
            'Unauthorized access to conversation'
        );

        $count = $markAsRead->execute($conversation, $user);

        return response()->json([
            'marked_as_read' => $count,
        ]);
    }
}
