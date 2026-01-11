import ChatWindow from '@/components/Chat/ChatWindow';
import { ConversationDetail, Message } from '@/types/chat';
import { Head, usePage } from '@inertiajs/react';

interface Props {
    conversation: ConversationDetail;
    messages: Message[];
}

interface PageProps {
    auth: {
        user: {
            id: number;
            name: string;
            email: string;
        };
    };
}

export default function ChatShow({ conversation, messages }: Props) {
    const { auth } = usePage<PageProps>().props;

    return (
        <>
            <Head title={`Chat with ${conversation.other_user.name}`} />

            <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 md:p-4 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
                <div
                    className="mx-auto flex h-full max-w-4xl flex-col md:h-full"
                    style={{ height: '100dvh' }}
                >
                    <ChatWindow
                        conversation={conversation}
                        initialMessages={messages}
                        currentUserId={auth.user.id}
                        onBack={() => window.history.back()}
                    />
                </div>
            </div>
        </>
    );
}
