import PageTransition from '@/components/PageTransition';
import { Button } from '@/components/ui/button';
import { Head, Link, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { CheckCircle2, MailCheck } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

interface Props {
    status?: string;
}

export default function VerifyEmail({ status }: Props) {
    const [processing, setProcessing] = useState(false);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        setProcessing(true);

        router.post(
            '/email/verification-notification',
            {},
            {
                onFinish: () => setProcessing(false),
            },
        );
    };

    return (
        <>
            <Head title="Email Verification" />

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
                            <MailCheck className="size-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Verify Your Email
                        </h1>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            Thanks for signing up! Before getting started, could
                            you verify your email address by clicking on the
                            link we just emailed to you?
                        </p>
                    </motion.div>

                    {/* Status Message */}
                    {status === 'verification-link-sent' && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-4 flex items-center gap-2 rounded-3xl border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-700 backdrop-blur-2xl dark:text-green-400"
                        >
                            <CheckCircle2 className="size-5" />A new
                            verification link has been sent to your email
                            address.
                        </motion.div>
                    )}

                    {/* Actions */}
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
                            {/* Resend Button */}
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
                                        ? 'Sending...'
                                        : 'Resend Verification Email'}
                                </Button>
                            </motion.div>
                        </form>

                        {/* Logout Link */}
                        <div className="mt-6 text-center">
                            <Link
                                href="/logout"
                                method="post"
                                as="button"
                                className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                                Log Out
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </PageTransition>
        </>
    );
}
