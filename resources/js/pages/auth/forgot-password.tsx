import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth/auth-layout';
import { login } from '@/routes';
import { email as passwordEmail } from '@/routes/password';
import { Head, Link, useForm } from '@inertiajs/react';

export default function ForgotPassword({ status }: { status?: string }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(passwordEmail());
    };

    return (
        <AuthLayout>
            <Head title="Forgot Password" />

            <div className="space-y-6">
                <div className="space-y-2 text-center">
                    <h1 className="text-2xl font-semibold tracking-tight text-white">
                        Reset password
                    </h1>
                    <p className="text-sm text-neutral-400">
                        Enter your email and we'll send you a reset link
                    </p>
                </div>

                {status && (
                    <div className="rounded-md bg-green-900/20 p-4">
                        <p className="text-sm text-green-400">{status}</p>
                    </div>
                )}

                <form onSubmit={submit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-neutral-200">
                            Email
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            className="border-[#2a2a2a] bg-[#0a0a0a] text-white placeholder:text-neutral-500 focus:border-[#4a4a4a] focus:ring-[#4a4a4a]"
                            autoComplete="username"
                            placeholder="name@example.com"
                            onChange={(e) => setData('email', e.target.value)}
                            required
                        />
                        <InputError message={errors.email} className="mt-2" />
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-white text-black hover:bg-neutral-200"
                        disabled={processing}
                    >
                        {processing ? 'Sending...' : 'Send reset link'}
                    </Button>
                </form>

                <div className="text-center text-sm text-neutral-400">
                    Remember your password?{' '}
                    <Link href={login()} className="text-white hover:underline">
                        Sign in
                    </Link>
                </div>
            </div>
        </AuthLayout>
    );
}
