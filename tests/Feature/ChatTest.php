<?php

declare(strict_types=1);

use App\Events\MessageRead;
use App\Events\MessageSent;
use App\Events\UserTyping;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Illuminate\Support\Facades\Event;

describe('Chat', function (): void {
    beforeEach(function (): void {
        $this->user = User::factory()->create();
        $this->other = User::factory()->create();
        Event::fake([MessageSent::class, MessageRead::class, UserTyping::class]);
    });

    describe('GET /chat', function (): void {
        it('requires authentication', function (): void {
            $this->get('/chat')->assertRedirect('/login');
        });

        it('shows conversations list', function (): void {
            Conversation::factory()->create([
                'user_id' => $this->user->getKey(),
                'recipient_id' => $this->other->getKey(),
            ]);

            $this->actingAs($this->user)
                ->get('/chat')
                ->assertSuccessful()
                ->assertInertia(fn ($page) => $page
                    ->component('Chat/Index')
                    ->has('conversations', 1)
                );
        });

        it('shows conversations from both sides', function (): void {
            Conversation::factory()->create([
                'user_id' => $this->other->getKey(),
                'recipient_id' => $this->user->getKey(),
            ]);

            $this->actingAs($this->user)
                ->get('/chat')
                ->assertSuccessful()
                ->assertInertia(fn ($page) => $page->has('conversations', 1));
        });
    });

    describe('GET /chat/{conversation}', function (): void {
        it('requires authentication', function (): void {
            $conversation = Conversation::factory()->create();
            $this->get("/chat/{$conversation->getKey()}")->assertRedirect('/login');
        });

        it('shows conversation messages', function (): void {
            $conversation = Conversation::factory()->create([
                'user_id' => $this->user->getKey(),
                'recipient_id' => $this->other->getKey(),
            ]);

            Message::factory()->create([
                'conversation_id' => $conversation->getKey(),
                'sender_id' => $this->other->getKey(),
                'content' => 'Hello!',
            ]);

            $this->actingAs($this->user)
                ->get("/chat/{$conversation->getKey()}")
                ->assertSuccessful()
                ->assertInertia(fn ($page) => $page
                    ->component('Chat/Show')
                    ->has('messages', 1)
                );
        });

        it('forbids access to other users conversation', function (): void {
            $thirdUser = User::factory()->create();
            $conversation = Conversation::factory()->create([
                'user_id' => $this->other->getKey(),
                'recipient_id' => $thirdUser->getKey(),
            ]);

            $this->actingAs($this->user)
                ->get("/chat/{$conversation->getKey()}")
                ->assertForbidden();
        });
    });

    describe('POST /chat/conversations', function (): void {
        it('requires authentication', function (): void {
            $this->postJson('/chat/conversations', [
                'recipient_id' => $this->other->getKey(),
            ])->assertUnauthorized();
        });

        it('creates a new conversation', function (): void {
            $this->actingAs($this->user)
                ->postJson('/chat/conversations', [
                    'recipient_id' => $this->other->getKey(),
                ])
                ->assertCreated()
                ->assertJsonStructure(['id']);

            $this->assertDatabaseHas('conversations', [
                'user_id' => $this->user->getKey(),
                'recipient_id' => $this->other->getKey(),
            ]);
        });

        it('returns existing conversation instead of creating duplicate', function (): void {
            $existing = Conversation::factory()->create([
                'user_id' => $this->user->getKey(),
                'recipient_id' => $this->other->getKey(),
            ]);

            $this->actingAs($this->user)
                ->postJson('/chat/conversations', [
                    'recipient_id' => $this->other->getKey(),
                ])
                ->assertCreated()
                ->assertJsonPath('id', $existing->getKey());

            $this->assertDatabaseCount('conversations', 1);
        });

        it('validates recipient_id exists', function (): void {
            $this->actingAs($this->user)
                ->postJson('/chat/conversations', ['recipient_id' => 99999])
                ->assertUnprocessable()
                ->assertJsonValidationErrors(['recipient_id']);
        });
    });

    describe('POST /chat/messages', function (): void {
        it('requires authentication', function (): void {
            $this->postJson('/chat/messages', [
                'recipient_id' => $this->other->getKey(),
                'content' => 'Hello!',
            ])->assertUnauthorized();
        });

        it('sends a message', function (): void {
            $this->actingAs($this->user)
                ->postJson('/chat/messages', [
                    'recipient_id' => $this->other->getKey(),
                    'content' => 'Hello!',
                ])
                ->assertCreated()
                ->assertJsonStructure(['id', 'conversation_id', 'content', 'created_at']);

            $this->assertDatabaseHas('messages', [
                'sender_id' => $this->user->getKey(),
                'content' => 'Hello!',
            ]);
        });

        it('broadcasts message sent event', function (): void {
            $this->actingAs($this->user)
                ->postJson('/chat/messages', [
                    'recipient_id' => $this->other->getKey(),
                    'content' => 'Hello!',
                ])
                ->assertCreated();

            Event::assertDispatched(MessageSent::class);
        });

        it('validates content is required', function (): void {
            $this->actingAs($this->user)
                ->postJson('/chat/messages', [
                    'recipient_id' => $this->other->getKey(),
                    'content' => '',
                ])
                ->assertUnprocessable()
                ->assertJsonValidationErrors(['content']);
        });
    });

    describe('POST /chat/conversations/{conversation}/mark-as-read', function (): void {
        it('requires authentication', function (): void {
            $conversation = Conversation::factory()->create();
            $this->postJson("/chat/conversations/{$conversation->getKey()}/mark-as-read")
                ->assertUnauthorized();
        });

        it('marks messages as read', function (): void {
            $conversation = Conversation::factory()->create([
                'user_id' => $this->user->getKey(),
                'recipient_id' => $this->other->getKey(),
            ]);

            Message::factory()->count(3)->create([
                'conversation_id' => $conversation->getKey(),
                'sender_id' => $this->other->getKey(),
                'read_at' => null,
            ]);

            $this->actingAs($this->user)
                ->postJson("/chat/conversations/{$conversation->getKey()}/mark-as-read")
                ->assertSuccessful()
                ->assertJsonPath('marked_as_read', 3);
        });

        it('forbids marking messages in other users conversations', function (): void {
            $thirdUser = User::factory()->create();
            $conversation = Conversation::factory()->create([
                'user_id' => $this->other->getKey(),
                'recipient_id' => $thirdUser->getKey(),
            ]);

            $this->actingAs($this->user)
                ->postJson("/chat/conversations/{$conversation->getKey()}/mark-as-read")
                ->assertForbidden();
        });
    });

    describe('POST /chat/conversations/{conversation}/typing', function (): void {
        it('requires authentication', function (): void {
            $conversation = Conversation::factory()->create();
            $this->postJson("/chat/conversations/{$conversation->getKey()}/typing", ['typing' => true])
                ->assertUnauthorized();
        });

        it('broadcasts typing event', function (): void {
            $conversation = Conversation::factory()->create([
                'user_id' => $this->user->getKey(),
                'recipient_id' => $this->other->getKey(),
            ]);

            $this->actingAs($this->user)
                ->postJson("/chat/conversations/{$conversation->getKey()}/typing", ['typing' => true])
                ->assertSuccessful();

            Event::assertDispatched(UserTyping::class);
        });

        it('forbids typing in other users conversations', function (): void {
            $thirdUser = User::factory()->create();
            $conversation = Conversation::factory()->create([
                'user_id' => $this->other->getKey(),
                'recipient_id' => $thirdUser->getKey(),
            ]);

            $this->actingAs($this->user)
                ->postJson("/chat/conversations/{$conversation->getKey()}/typing", ['typing' => true])
                ->assertForbidden();
        });
    });
});
