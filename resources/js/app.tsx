import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { configureEcho } from '@laravel/echo-react';
import { AnimatePresence } from 'framer-motion';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Validate required environment variables
if (!import.meta.env.VITE_REVERB_APP_KEY) {
    console.error(
        'VITE_REVERB_APP_KEY is not set. WebSocket connections will fail.',
    );
}

if (!import.meta.env.VITE_REVERB_HOST) {
    console.error(
        'VITE_REVERB_HOST is not set. WebSocket connections will fail.',
    );
}

configureEcho({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST || window.location.hostname,
    wsPort: import.meta.env.VITE_REVERB_PORT
        ? Number.parseInt(import.meta.env.VITE_REVERB_PORT)
        : 80,
    wssPort: import.meta.env.VITE_REVERB_PORT
        ? Number.parseInt(import.meta.env.VITE_REVERB_PORT)
        : 443,
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
    enabledTransports: ['ws', 'wss'],
});

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) =>
        resolvePageComponent(
            `./pages/${name}.tsx`,
            import.meta.glob('./pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <StrictMode>
                <AnimatePresence mode="wait" initial={false}>
                    <App {...props} />
                </AnimatePresence>
            </StrictMode>,
        );
    },
    progress: {
        color: '#4B5563',
    },
});
