import { Head } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';
import { ConversationDetail, Message } from '@/types/chat';
import ChatWindow from '@/Components/Chat/ChatWindow';

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

            <div className="h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
                <div className="mx-auto h-full max-w-4xl">
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
