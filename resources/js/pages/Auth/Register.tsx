import PageTransition from '@/components/PageTransition';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Head, Link, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    AlertCircle,
    Calendar,
    Lock,
    Mail,
    User,
    UserPlus,
    Users,
} from 'lucide-react';
import { FormEventHandler, useState } from 'react';

interface Props {
    errors?: Record<string, string>;
}

export default function Register({ errors }: Props) {
    const [data, setData] = useState({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        age: '',
        gender: '',
    });

    const [processing, setProcessing] = useState(false);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        setProcessing(true);

        router.post('/register', data, {
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <>
            <Head title="Register" />

            <PageTransition className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
                <div className="w-full max-w-md">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            type: 'spring',
                            stiffness: 300,
                            damping: 30,
                        }}
                        className="mb-6 overflow-hidden rounded-3xl border border-white/20 bg-white/10 p-6 text-center shadow-2xl backdrop-blur-2xl backdrop-saturate-150"
                    >
                        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30">
                            <UserPlus className="size-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Create Account
                        </h1>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            Join FindFriend to meet new people nearby
                        </p>
                    </motion.div>

                    {/* Register Form */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                            type: 'spring',
                            stiffness: 300,
                            damping: 30,
                            delay: 0.1,
                        }}
                        className="overflow-hidden rounded-3xl border border-white/20 bg-white/10 p-8 shadow-2xl backdrop-blur-2xl backdrop-saturate-150"
                    >
                        <form onSubmit={submit} className="space-y-5">
                            {/* Name */}
                            <div>
                                <label
                                    htmlFor="name"
                                    className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                                >
                                    Name
                                </label>
                                <div className="relative">
                                    <User className="absolute top-1/2 left-3 size-5 -translate-y-1/2 text-gray-400" />
                                    <Input
                                        id="name"
                                        type="text"
                                        name="name"
                                        value={data.name}
                                        onChange={(e) =>
                                            setData({
                                                ...data,
                                                name: e.target.value,
                                            })
                                        }
                                        className="border-white/20 bg-white/10 pl-11 backdrop-blur-2xl backdrop-saturate-150 focus:border-blue-500/50 focus:bg-white/20"
                                        required
                                        autoFocus
                                        autoComplete="name"
                                        aria-invalid={!!errors?.name}
                                    />
                                </div>
                                {errors?.name && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mt-2 flex items-center gap-1 text-sm text-red-600 dark:text-red-400"
                                    >
                                        <AlertCircle className="size-4" />
                                        {errors.name}
                                    </motion.div>
                                )}
                            </div>

                            {/* Email */}
                            <div>
                                <label
                                    htmlFor="email"
                                    className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                                >
                                    Email
                                </label>
                                <div className="relative">
                                    <Mail className="absolute top-1/2 left-3 size-5 -translate-y-1/2 text-gray-400" />
                                    <Input
                                        id="email"
                                        type="email"
                                        name="email"
                                        value={data.email}
                                        onChange={(e) =>
                                            setData({
                                                ...data,
                                                email: e.target.value,
                                            })
                                        }
                                        className="border-white/20 bg-white/10 pl-11 backdrop-blur-2xl backdrop-saturate-150 focus:border-blue-500/50 focus:bg-white/20"
                                        required
                                        autoComplete="username"
                                        aria-invalid={!!errors?.email}
                                    />
                                </div>
                                {errors?.email && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mt-2 flex items-center gap-1 text-sm text-red-600 dark:text-red-400"
                                    >
                                        <AlertCircle className="size-4" />
                                        {errors.email}
                                    </motion.div>
                                )}
                            </div>

                            {/* Age & Gender Row */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                {/* Age */}
                                <div>
                                    <label
                                        htmlFor="age"
                                        className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                                    >
                                        Age
                                    </label>
                                    <div className="relative">
                                        <Calendar className="absolute top-1/2 left-3 size-5 -translate-y-1/2 text-gray-400" />
                                        <Input
                                            id="age"
                                            type="number"
                                            name="age"
                                            value={data.age}
                                            onChange={(e) =>
                                                setData({
                                                    ...data,
                                                    age: e.target.value,
                                                })
                                            }
                                            className="border-white/20 bg-white/10 pl-11 backdrop-blur-2xl backdrop-saturate-150 focus:border-blue-500/50 focus:bg-white/20"
                                            min="18"
                                            max="120"
                                            aria-invalid={!!errors?.age}
                                        />
                                    </div>
                                    {errors?.age && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="mt-2 flex items-center gap-1 text-xs text-red-600 dark:text-red-400"
                                        >
                                            <AlertCircle className="size-3" />
                                            {errors.age}
                                        </motion.div>
                                    )}
                                </div>

                                {/* Gender */}
                                <div>
                                    <label
                                        htmlFor="gender"
                                        className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                                    >
                                        Gender
                                    </label>
                                    <div className="relative">
                                        <Users className="absolute top-1/2 left-3 size-5 -translate-y-1/2 text-gray-400" />
                                        <select
                                            id="gender"
                                            name="gender"
                                            value={data.gender}
                                            onChange={(e) =>
                                                setData({
                                                    ...data,
                                                    gender: e.target.value,
                                                })
                                            }
                                            className="flex h-9 w-full rounded-md border border-white/20 bg-white/10 pr-3 pl-11 text-sm backdrop-blur-2xl backdrop-saturate-150 transition-[color,box-shadow] outline-none focus:border-blue-500/50 focus:bg-white/20 focus:ring-2 focus:ring-blue-500/20 dark:text-white"
                                            aria-invalid={!!errors?.gender}
                                        >
                                            <option value="">Select</option>
                                            <option value="male">Male</option>
                                            <option value="female">
                                                Female
                                            </option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                    {errors?.gender && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="mt-2 flex items-center gap-1 text-xs text-red-600 dark:text-red-400"
                                        >
                                            <AlertCircle className="size-3" />
                                            {errors.gender}
                                        </motion.div>
                                    )}
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label
                                    htmlFor="password"
                                    className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                                >
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute top-1/2 left-3 size-5 -translate-y-1/2 text-gray-400" />
                                    <Input
                                        id="password"
                                        type="password"
                                        name="password"
                                        value={data.password}
                                        onChange={(e) =>
                                            setData({
                                                ...data,
                                                password: e.target.value,
                                            })
                                        }
                                        className="border-white/20 bg-white/10 pl-11 backdrop-blur-2xl backdrop-saturate-150 focus:border-blue-500/50 focus:bg-white/20"
                                        required
                                        autoComplete="new-password"
                                        aria-invalid={!!errors?.password}
                                    />
                                </div>
                                {errors?.password && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mt-2 flex items-center gap-1 text-sm text-red-600 dark:text-red-400"
                                    >
                                        <AlertCircle className="size-4" />
                                        {errors.password}
                                    </motion.div>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label
                                    htmlFor="password_confirmation"
                                    className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                                >
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute top-1/2 left-3 size-5 -translate-y-1/2 text-gray-400" />
                                    <Input
                                        id="password_confirmation"
                                        type="password"
                                        name="password_confirmation"
                                        value={data.password_confirmation}
                                        onChange={(e) =>
                                            setData({
                                                ...data,
                                                password_confirmation:
                                                    e.target.value,
                                            })
                                        }
                                        className="border-white/20 bg-white/10 pl-11 backdrop-blur-2xl backdrop-saturate-150 focus:border-blue-500/50 focus:bg-white/20"
                                        required
                                        autoComplete="new-password"
                                    />
                                </div>
                            </div>

                            {/* Submit Button */}
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="pt-2"
                            >
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full bg-gradient-to-br from-blue-500 to-blue-600 py-6 text-base shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40"
                                >
                                    {processing
                                        ? 'Creating account...'
                                        : 'Create Account'}
                                </Button>
                            </motion.div>
                        </form>

                        {/* Login Link */}
                        <div className="mt-6 text-center">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Already have an account?{' '}
                                <Link
                                    href="/login"
                                    className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                >
                                    Sign in
                                </Link>
                            </p>
                        </div>
                    </motion.div>
                </div>
            </PageTransition>
        </>
    );
}
