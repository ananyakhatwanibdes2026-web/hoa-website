import {defineConfig} from 'vite';
import {hydrogen} from '@shopify/hydrogen/vite';
import {oxygen} from '@shopify/mini-oxygen/vite';
import {reactRouter} from '@react-router/dev/vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    tailwindcss(),
    hydrogen(),
    oxygen(),
    reactRouter(),
    tsconfigPaths(),
  ],
  build: {
    // Allow a strict Content-Security-Policy
    // without inlining assets as base64:
    assetsInlineLimit: 0,
  },
  ssr: {
    optimizeDeps: {
      /**
       * Only include packages that genuinely need CJS->ESM pre-bundling for SSR.
       * Browser-only packages (three, R3F, drei, fflate, three-stdlib) must NOT
       * appear here -- they live in ssr.external below.
       * @see https://vitejs.dev/config/dep-optimization-options
       */
      include: ['scheduler'],
    },
    // These packages are browser-only and must never be bundled into the SSR build.
    // Marking them external tells Vite to skip them entirely during SSR analysis.
    // They are safe to skip because all 3D components are loaded exclusively via
    // React.lazy behind a ClientOnly gate -- the dynamic import never fires on the server.
    external: [
      'three',
      '@react-three/fiber',
      '@react-three/drei',
      '@react-three/postprocessing',
      'postprocessing',
      'three-stdlib',
      'fflate',
    ],
  },
  server: {
    allowedHosts: ['.tryhydrogen.dev'],
  },
});
