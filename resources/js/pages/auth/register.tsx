import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth/auth-layout';
import { login } from '@/routes';
import { store as registerStore } from '@/routes/register';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Register() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(registerStore());
    };

    return (
        <AuthLayout>
            <Head title="Sign up" />

            <div className="space-y-6">
                <div className="space-y-2 text-center">
                    <h1 className="text-2xl font-semibold tracking-tight text-white">
                        Create an account
                    </h1>
                    <p className="text-sm text-neutral-400">
                        Enter your information to get started
                    </p>
                </div>

                <form onSubmit={submit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-neutral-200">
                            Name
                        </Label>
                        <Input
                            id="name"
                            type="text"
                            name="name"
                            value={data.name}
                            className="border-[#2a2a2a] bg-[#0a0a0a] text-white placeholder:text-neutral-500 focus:border-[#4a4a4a] focus:ring-[#4a4a4a]"
                            autoComplete="name"
                            placeholder="John Doe"
                            onChange={(e) => setData('name', e.target.value)}
                            required
                        />
                        <InputError message={errors.name} className="mt-2" />
                    </div>

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
                        <Label htmlFor="password" className="text-neutral-200">
                            Password
                        </Label>
                        <Input
                            id="password"
                            type="password"
                            name="password"
                            value={data.password}
                            className="border-[#2a2a2a] bg-[#0a0a0a] text-white placeholder:text-neutral-500 focus:border-[#4a4a4a] focus:ring-[#4a4a4a]"
                            autoComplete="new-password"
                            placeholder="••••••••"
                            onChange={(e) => setData('password', e.target.value)}
                            required
                        />
                        <InputError message={errors.password} className="mt-2" />
                    </div>

                    <div className="space-y-2">
                        <Label
                            htmlFor="password_confirmation"
                            className="text-neutral-200"
                        >
                            Confirm Password
                        </Label>
                        <Input
                            id="password_confirmation"
                            type="password"
                            name="password_confirmation"
                            value={data.password_confirmation}
                            className="border-[#2a2a2a] bg-[#0a0a0a] text-white placeholder:text-neutral-500 focus:border-[#4a4a4a] focus:ring-[#4a4a4a]"
                            autoComplete="new-password"
                            placeholder="••••••••"
                            onChange={(e) =>
                                setData('password_confirmation', e.target.value)
                            }
                            required
                        />
                        <InputError
                            message={errors.password_confirmation}
                            className="mt-2"
                        />
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-white text-black hover:bg-neutral-200"
                        disabled={processing}
                    >
                        {processing ? 'Creating account...' : 'Create account'}
                    </Button>
                </form>

                <div className="text-center text-sm text-neutral-400">
                    Already have an account?{' '}
                    <Link href={login()} className="text-white hover:underline">
                        Sign in
                    </Link>
                </div>
            </div>
        </AuthLayout>
    );
}
