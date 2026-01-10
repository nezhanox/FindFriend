<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\Chat\CreateConversationAction;
use App\Actions\Chat\MarkMessagesAsReadAction;
use App\Models\Conversation;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ConversationController extends Controller
{
    /**
     * Display a listing of user's conversations.
     */
    public function index(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();

        $conversations = Conversation::query()
            ->where('user_id', $user->getKey())
            ->orWhere('recipient_id', $user->getKey())
            ->with(['user', 'recipient', 'lastMessage.sender'])
            ->orderByDesc('last_message_at')
            ->get()
            ->map(function (Conversation $conversation) use ($user): array {
                $otherUser = $conversation->getOtherParticipant($user->getKey());

                return [
                    'id' => $conversation->getKey(),
                    'other_user' => [
                        'id' => $otherUser->getKey(),
                        'name' => $otherUser->name,
                        'avatar' => $otherUser->avatar,
                    ],
                    'last_message' => $conversation->lastMessage ? [
                        'content' => $conversation->lastMessage->content,
                        'created_at' => $conversation->lastMessage->created_at?->toISOString(),
                        'is_own' => $conversation->lastMessage->sender_id === $user->getKey(),
                    ] : null,
                    'last_message_at' => $conversation->last_message_at?->toISOString(),
                ];
            });

        return Inertia::render('Chat/Index', [
            'conversations' => $conversations,
        ]);
    }

    /**
     * Display the specified conversation with messages.
     */
    public function show(Request $request, Conversation $conversation): Response
    {
        /** @var User $user */
        $user = $request->user();

        // Authorize: user must be part of the conversation
        abort_unless(
            $conversation->user_id === $user->getKey() || $conversation->recipient_id === $user->getKey(),
            403,
            'Unauthorized access to conversation'
        );

        // Mark messages as read
        app(MarkMessagesAsReadAction::class)->execute($conversation, $user);

        $messages = $conversation->messages()
            ->with('sender')
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(fn ($message): array => [
                'id' => $message->getKey(),
                'sender_id' => $message->sender_id,
                'content' => $message->content,
                'created_at' => $message->created_at?->toISOString(),
                'read_at' => $message->read_at?->toISOString(),
                'sender' => [
                    'id' => $message->sender->getKey(),
                    'name' => $message->sender->name,
                    'avatar' => $message->sender->avatar,
                ],
            ]);

        $otherUser = $conversation->getOtherParticipant($user->getKey());

        return Inertia::render('Chat/Show', [
            'conversation' => [
                'id' => $conversation->getKey(),
                'other_user' => [
                    'id' => $otherUser->getKey(),
                    'name' => $otherUser->name,
                    'avatar' => $otherUser->avatar,
                ],
            ],
            'messages' => $messages,
        ]);
    }

    /**
     * Create a new conversation with a user.
     */
    public function store(Request $request, CreateConversationAction $createConversation): \Illuminate\Http\JsonResponse
    {
        ds($request->all());
        $request->validate([
            'recipient_id' => ['required', 'integer', 'exists:users,id'],
        ]);

        /** @var User $user */
        $user = $request->user();
        $recipient = User::query()->findOrFail($request->input('recipient_id'));

        $conversation = $createConversation->execute($user, $recipient);

        return response()->json([
            'id' => $conversation->getKey(),
        ], 201);
    }
}
