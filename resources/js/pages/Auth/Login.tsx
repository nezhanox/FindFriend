import PageTransition from '@/components/PageTransition';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Head, Link, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { AlertCircle, Lock, LogIn, Mail } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

interface Props {
    status?: string;
    errors?: Record<string, string>;
}

export default function Login({ status, errors }: Props) {
    const [data, setData] = useState({
        email: '',
        password: '',
        remember: false,
    });

    const [processing, setProcessing] = useState(false);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        setProcessing(true);

        router.post('/login', data, {
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <>
            <Head title="Login" />

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
                            <LogIn className="size-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Welcome Back
                        </h1>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            Sign in to continue to FindFriend
                        </p>
                    </motion.div>

                    {/* Status Message */}
                    {status && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-4 rounded-3xl border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-700 backdrop-blur-2xl dark:text-green-400"
                        >
                            {status}
                        </motion.div>
                    )}

                    {/* Login Form */}
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
                                        autoComplete="current-password"
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

                            {/* Remember Me */}
                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        name="remember"
                                        checked={data.remember}
                                        onChange={(e) =>
                                            setData({
                                                ...data,
                                                remember: e.target.checked,
                                            })
                                        }
                                        className="size-4 rounded border-white/20 bg-white/10 text-blue-600 focus:ring-2 focus:ring-blue-500/50"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">
                                        Remember me
                                    </span>
                                </label>

                                <Link
                                    href="/forgot-password"
                                    className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                >
                                    Forgot password?
                                </Link>
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
                                    {processing ? 'Signing in...' : 'Sign In'}
                                </Button>
                            </motion.div>
                        </form>

                        {/* Register Link */}
                        <div className="mt-6 text-center">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Don't have an account?{' '}
                                <Link
                                    href="/register"
                                    className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                >
                                    Sign up
                                </Link>
                            </p>
                        </div>
                    </motion.div>
                </div>
            </PageTransition>
        </>
    );
}
