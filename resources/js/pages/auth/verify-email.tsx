import { Button } from '@/components/ui/button';
import AuthLayout from '@/layouts/auth/auth-layout';
import { logout } from '@/routes';
import { send as verificationSend } from '@/routes/verification';
import { Head, Link, useForm } from '@inertiajs/react';

export default function VerifyEmail({ status }: { status?: string }) {
    const { post, processing } = useForm({});

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(verificationSend());
    };

    return (
        <AuthLayout>
            <Head title="Email Verification" />

            <div className="space-y-6">
                <div className="space-y-2 text-center">
                    <h1 className="text-2xl font-semibold tracking-tight text-white">
                        Verify your email
                    </h1>
                    <p className="text-sm text-neutral-400">
                        Thanks for signing up! Before getting started, could you
                        verify your email address by clicking on the link we just
                        emailed to you? If you didn't receive the email, we'll gladly
                        send you another.
                    </p>
                </div>

                {status === 'verification-link-sent' && (
                    <div className="rounded-md bg-green-900/20 p-4">
                        <p className="text-sm text-green-400">
                            A new verification link has been sent to your email
                            address.
                        </p>
                    </div>
                )}

                <form onSubmit={submit} className="space-y-4">
                    <Button
                        type="submit"
                        className="w-full bg-white text-black hover:bg-neutral-200"
                        disabled={processing}
                    >
                        {processing
                            ? 'Sending...'
                            : 'Resend Verification Email'}
                    </Button>
                </form>

                <div className="text-center">
                    <Link
                        href={logout()}
                        method="post"
                        as="button"
                        className="text-sm text-neutral-400 hover:text-white"
                    >
                        Log out
                    </Link>
                </div>
            </div>
        </AuthLayout>
    );
}
