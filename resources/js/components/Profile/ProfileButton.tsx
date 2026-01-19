import { motion } from 'framer-motion';
import { User as UserIcon } from 'lucide-react';
import { useState } from 'react';
import ProfileEditModal from './ProfileEditModal';

interface User {
    name: string;
    email: string;
    avatar?: string | null;
    age?: number | null;
    gender?: 'male' | 'female' | 'other' | null;
    location?: {
        address: string | null;
        lat: number;
        lng: number;
    } | null;
}

interface ProfileButtonProps {
    user: User;
}

export default function ProfileButton({ user }: ProfileButtonProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsModalOpen(true)}
                className="relative flex size-10 items-center justify-center overflow-hidden rounded-full border-2 border-white/50 bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg transition-all hover:border-white hover:shadow-xl dark:border-gray-700/50 dark:hover:border-gray-600"
                title="Редагувати профіль"
            >
                {user.avatar ? (
                    <img
                        src={`/storage/${user.avatar}`}
                        alt={user.name}
                        className="size-full object-cover"
                    />
                ) : (
                    <UserIcon className="size-5 text-white" />
                )}
            </motion.button>

            <ProfileEditModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                user={user}
            />
        </>
    );
}
