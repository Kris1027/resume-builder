import path from 'path';
import { defineConfig } from 'vite';
import type { Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import { VitePWA } from 'vite-plugin-pwa';

const htmlCsp = (): Plugin => ({
    name: 'html-csp',
    transformIndexHtml: {
        order: 'post',
        handler(html) {
            const csp = [
                "default-src 'self'",
                "script-src 'self'",
                "style-src 'self' 'unsafe-inline'",
                "img-src 'self' data: blob:",
                "font-src 'self'",
                "connect-src 'self'",
                "worker-src 'self' blob:",
                "object-src 'none'",
                "base-uri 'self'",
                "form-action 'self'",
            ].join('; ');

            return html.replace(
                '<head>',
                `<head>\n    <meta http-equiv="Content-Security-Policy" content="${csp}">`,
            );
        },
    },
});

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
    plugins: [
        tanstackRouter({
            target: 'react',
            autoCodeSplitting: true,
        }),
        react(),
        tailwindcss(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: [
                'favicon.svg',
                'favicon-32x32.png',
                'favicon-16x16.png',
                'apple-touch-icon.png',
            ],
            manifest: {
                name: 'Resume Builder - Create Professional Resumes',
                short_name: 'Resume Builder',
                description: 'Create professional resumes with multiple templates and PDF export',
                theme_color: '#a7f3d0',
                background_color: '#ffffff',
                display: 'standalone',
                scope: '/',
                start_url: '/',
                icons: [
                    {
                        src: '/pwa-192x192.png',
                        sizes: '192x192',
                        type: 'image/png',
                    },
                    {
                        src: '/pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                    },
                    {
                        src: '/pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'maskable',
                    },
                ],
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
            },
        }),
        ...(command === 'build' ? [htmlCsp()] : []),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
        },
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (
                        id.includes('node_modules/motion') ||
                        id.includes('node_modules/framer-motion')
                    ) {
                        return 'motion';
                    }
                    if (id.includes('node_modules/@radix-ui')) {
                        return 'radix';
                    }
                },
            },
        },
    },
}));
