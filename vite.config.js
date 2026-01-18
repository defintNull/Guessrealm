import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [
        laravel({
            input: [
                'resources/css/app.css',
                'resources/js/main.jsx'
            ],
            refresh: true,
        }),
        tailwindcss(),
        react(),
    ],

    optimizeDeps: {
        exclude: [
            'onnxruntime-web',
            'onnxruntime-web/webgpu'
        ],

    },

    build: {
        target: 'esnext',
        minify: 'esbuild',
        rollupOptions: {
            output: {
                manualChunks: {
                    'onnxruntime-web': ['onnxruntime-web'],
                },
            },
        },
    },

    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'resources/js'),
        },
    },

    server: {
        watch: {
            ignored: ['**/storage/framework/views/**'],
        },
    },
});
