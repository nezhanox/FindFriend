import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth/auth-layout';
import { store as loginStore } from '@/routes/login';
import { request as passwordRequest } from '@/routes/password';
import { register } from '@/routes';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Login() {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(loginStore());
    };

    return (
        <AuthLayout>
            <Head title="Log in" />

            <div className="space-y-6">
                <div className="space-y-2 text-center">
                    <h1 className="text-2xl font-semibold tracking-tight text-white">
                        Welcome back
                    </h1>
                    <p className="text-sm text-neutral-400">
                        Enter your credentials to access your account
                    </p>
                </div>

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

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="password" className="text-neutral-200">
                                Password
                            </Label>
                            <Link
                                href={passwordRequest()}
                                className="text-sm text-neutral-400 hover:text-neutral-200"
                            >
                                Forgot password?
                            </Link>
                        </div>
                        <Input
                            id="password"
                            type="password"
                            name="password"
                            value={data.password}
                            className="border-[#2a2a2a] bg-[#0a0a0a] text-white placeholder:text-neutral-500 focus:border-[#4a4a4a] focus:ring-[#4a4a4a]"
                            autoComplete="current-password"
                            placeholder="••••••••"
                            onChange={(e) => setData('password', e.target.value)}
                            required
                        />
                        <InputError message={errors.password} className="mt-2" />
                    </div>

                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="remember"
                            name="remember"
                            checked={data.remember}
                            onChange={(e) => setData('remember', e.target.checked)}
                            className="h-4 w-4 rounded border-[#2a2a2a] bg-[#0a0a0a] text-white focus:ring-[#4a4a4a]"
                        />
                        <label
                            htmlFor="remember"
                            className="text-sm text-neutral-400"
                        >
                            Remember me
                        </label>
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-white text-black hover:bg-neutral-200"
                        disabled={processing}
                    >
                        {processing ? 'Signing in...' : 'Sign in'}
                    </Button>
                </form>

                <div className="text-center text-sm text-neutral-400">
                    Don't have an account?{' '}
                    <Link
                        href={register()}
                        className="text-white hover:underline"
                    >
                        Sign up
                    </Link>
                </div>
            </div>
        </AuthLayout>
    );
}
