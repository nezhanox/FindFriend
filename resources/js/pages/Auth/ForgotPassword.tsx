import { FormEventHandler, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { KeyRound, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Props {
    status?: string;
    errors?: Record<string, string>;
}

export default function ForgotPassword({ status, errors }: Props) {
    const [email, setEmail] = useState('');
    const [processing, setProcessing] = useState(false);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        setProcessing(true);

        router.post('/forgot-password', { email }, {
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <>
            <Head title="Forgot Password" />

            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
                <div className="w-full max-w-md">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="mb-6 overflow-hidden rounded-3xl border border-white/20 bg-white/10 p-6 text-center shadow-2xl backdrop-blur-2xl backdrop-saturate-150"
                    >
                        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30">
                            <KeyRound className="size-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Forgot Password?
                        </h1>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            No problem. Just let us know your email address and we'll email you a
                            password reset link.
                        </p>
                    </motion.div>

                    {/* Status Message */}
                    {status && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-4 flex items-center gap-2 rounded-3xl border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-700 backdrop-blur-2xl dark:text-green-400"
                        >
                            <CheckCircle2 className="size-5" />
                            {status}
                        </motion.div>
                    )}

                    {/* Form */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.1 }}
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
                                    <Mail className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
                                    <Input
                                        id="email"
                                        type="email"
                                        name="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-11 border-white/20 bg-white/10 backdrop-blur-2xl backdrop-saturate-150 focus:border-blue-500/50 focus:bg-white/20"
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

                            {/* Submit Button */}
                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full bg-gradient-to-br from-blue-500 to-blue-600 py-6 text-base shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40"
                                >
                                    {processing
                                        ? 'Sending reset link...'
                                        : 'Email Password Reset Link'}
                                </Button>
                            </motion.div>
                        </form>

                        {/* Back to Login */}
                        <div className="mt-6 text-center">
                            <Link
                                href="/login"
                                className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                                Back to Login
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </div>
        </>
    );
}
