import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    AlertCircle,
    Camera,
    Mail,
    MapPin,
    Save,
    User as UserIcon,
    X,
} from 'lucide-react';
import { FormEventHandler, useEffect, useMemo, useRef, useState } from 'react';

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

interface ProfileEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User;
}

export default function ProfileEditModal({
    isOpen,
    onClose,
    user,
}: ProfileEditModalProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initialize form data based on user
    const initialData = useMemo(
        () => ({
            name: user.name,
            email: user.email,
            age: user.age?.toString() || '',
            gender: user.gender || '',
            avatar: null as File | null,
        }),
        [user.name, user.email, user.age, user.gender],
    );

    const { data, setData, post, processing, errors } = useForm(initialData);

    // Set avatar preview based on user
    const defaultAvatarPreview = user.avatar ? `/storage/${user.avatar}` : null;
    const [avatarPreview, setAvatarPreview] = useState<string | null>(
        defaultAvatarPreview,
    );

    // Reset avatar preview when user changes
    useEffect(() => {
        setAvatarPreview(defaultAvatarPreview);
    }, [defaultAvatarPreview]);

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('avatar', file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post('/profile/update', {
            onSuccess: () => {
                onClose();
            },
            preserveScroll: true,
        });
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{
                                type: 'spring',
                                stiffness: 300,
                                damping: 30,
                            }}
                            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/20 bg-white/90 shadow-2xl backdrop-blur-2xl backdrop-saturate-150 dark:bg-gray-900/90"
                        >
                            {/* Close Button */}
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 z-10 rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                            >
                                <X className="size-5" />
                            </button>

                            {/* Header */}
                            <div className="border-b border-gray-200/50 bg-gradient-to-r from-blue-500 to-purple-600 p-6 dark:border-gray-700/50">
                                <div className="flex items-center gap-3">
                                    <div className="flex size-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                                        <UserIcon className="size-6 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">
                                            Редагування профілю
                                        </h2>
                                        <p className="text-sm text-white/80">
                                            Оновіть свої дані
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Form */}
                            <form
                                onSubmit={submit}
                                className="max-h-[calc(100vh-200px)] overflow-y-auto p-6"
                            >
                                <div className="space-y-5">
                                    {/* Avatar */}
                                    <div className="flex flex-col items-center">
                                        <div className="relative">
                                            <div className="size-24 overflow-hidden rounded-full border-4 border-white shadow-lg dark:border-gray-800">
                                                {avatarPreview ? (
                                                    <img
                                                        src={avatarPreview}
                                                        alt="Avatar"
                                                        className="size-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex size-full items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
                                                        <UserIcon className="size-12 text-white" />
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    fileInputRef.current?.click()
                                                }
                                                className="absolute right-0 bottom-0 rounded-full bg-blue-600 p-2 text-white shadow-lg transition-colors hover:bg-blue-700"
                                            >
                                                <Camera className="size-4" />
                                            </button>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                onChange={handleAvatarChange}
                                                className="hidden"
                                            />
                                        </div>
                                        {errors.avatar && (
                                            <p className="mt-2 flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
                                                <AlertCircle className="size-4" />
                                                {errors.avatar}
                                            </p>
                                        )}
                                    </div>

                                    {/* Name */}
                                    <div>
                                        <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                            <UserIcon className="size-4" />
                                            Ім'я
                                        </label>
                                        <Input
                                            type="text"
                                            value={data.name}
                                            onChange={(e) =>
                                                setData('name', e.target.value)
                                            }
                                            className="w-full"
                                            aria-invalid={!!errors.name}
                                        />
                                        {errors.name && (
                                            <p className="mt-1 flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
                                                <AlertCircle className="size-4" />
                                                {errors.name}
                                            </p>
                                        )}
                                    </div>

                                    {/* Email */}
                                    <div>
                                        <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                            <Mail className="size-4" />
                                            Email
                                        </label>
                                        <Input
                                            type="email"
                                            value={data.email}
                                            onChange={(e) =>
                                                setData('email', e.target.value)
                                            }
                                            className="w-full"
                                            aria-invalid={!!errors.email}
                                        />
                                        {errors.email && (
                                            <p className="mt-1 flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
                                                <AlertCircle className="size-4" />
                                                {errors.email}
                                            </p>
                                        )}
                                    </div>

                                    {/* Age & Gender */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Вік
                                            </label>
                                            <Input
                                                type="number"
                                                value={data.age}
                                                onChange={(e) =>
                                                    setData(
                                                        'age',
                                                        e.target.value,
                                                    )
                                                }
                                                min="18"
                                                max="120"
                                                className="w-full"
                                                aria-invalid={!!errors.age}
                                            />
                                            {errors.age && (
                                                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                                                    {errors.age}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Стать
                                            </label>
                                            <select
                                                value={data.gender}
                                                onChange={(e) =>
                                                    setData(
                                                        'gender',
                                                        e.target.value,
                                                    )
                                                }
                                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                                            >
                                                <option value="">
                                                    Не вказано
                                                </option>
                                                <option value="male">
                                                    Чоловік
                                                </option>
                                                <option value="female">
                                                    Жінка
                                                </option>
                                                <option value="other">
                                                    Інше
                                                </option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Location (Read-only) */}
                                    {user.location && (
                                        <div>
                                            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                                <MapPin className="size-4" />
                                                Поточна адреса
                                            </label>
                                            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                                                {user.location.address ||
                                                    `${user.location.lat}, ${user.location.lng}`}
                                            </div>
                                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                Адресу можна змінити на мапі
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Submit Button */}
                                <div className="mt-6 flex gap-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={onClose}
                                        className="flex-1"
                                        disabled={processing}
                                    >
                                        Скасувати
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                                        disabled={processing}
                                    >
                                        <Save className="mr-2 size-4" />
                                        {processing
                                            ? 'Збереження...'
                                            : 'Зберегти'}
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
