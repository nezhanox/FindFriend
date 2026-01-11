import PageTransition from '@/components/PageTransition';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Head, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { AlertCircle, KeyRound, Lock, Mail } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

interface Props {
    token: string;
    email: string;
    errors?: Record<string, string>;
}

export default function ResetPassword({
    token,
    email: initialEmail,
    errors,
}: Props) {
    const [data, setData] = useState({
        token: token,
        email: initialEmail,
        password: '',
        password_confirmation: '',
    });

    const [processing, setProcessing] = useState(false);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        setProcessing(true);

        router.post('/reset-password', data, {
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <>
            <Head title="Reset Password" />

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
                            <KeyRound className="size-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Reset Password
                        </h1>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            Enter your new password below
                        </p>
                    </motion.div>

                    {/* Form */}
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
                        <form onSubmit={submit} className="space-y-6">
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
                                        autoFocus
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

                            {/* Password */}
                            <div>
                                <label
                                    htmlFor="password"
                                    className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                                >
                                    New Password
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
                                    Confirm New Password
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
                            >
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full bg-gradient-to-br from-blue-500 to-blue-600 py-6 text-base shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40"
                                >
                                    {processing
                                        ? 'Resetting password...'
                                        : 'Reset Password'}
                                </Button>
                            </motion.div>
                        </form>
                    </motion.div>
                </div>
            </PageTransition>
        </>
    );
}
