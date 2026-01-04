import AppLogo from '@/components/app-logo';
import { home } from '@/routes';
import { Link } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';

export default function AuthLayout({ children }: PropsWithChildren) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] p-4">
            <div className="w-full max-w-md">
                <div className="mb-8 flex justify-center">
                    <Link href={home()}>
                        <AppLogo className="h-12 w-auto" />
                    </Link>
                </div>

                <div className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-8 shadow-2xl">
                    {children}
                </div>
            </div>
        </div>
    );
}
