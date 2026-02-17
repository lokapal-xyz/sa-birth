import { defineConfig } from 'vite';
import react            from '@vitejs/plugin-react';
import path             from 'path';
import inject           from '@rollup/plugin-inject';

// NOTE: vite-plugin-node-polyfills is intentionally NOT used here.
// It lives in the repo-root node_modules while Vite runs from
// sa-birth-frontend/node_modules — two incompatible Plugin types.
// We shim only what's actually needed:
//   • Buffer  → via @rollup/plugin-inject + the 'buffer' npm package
//   • process → via Vite's built-in `define` (no package needed)
//   • global  → via Vite's built-in `define`

export default defineConfig({
  plugins: [
    react(),

    // Shim Buffer for packages that still reference it (stellar-sdk, bb.js).
    // We only inject Buffer — NOT process, because process/browser.js has no
    // default export and causes "does not provide an export named 'default'".
    // process is covered by the `define` block below instead.
    inject({
      Buffer: ['buffer', 'Buffer'],
    }),
  ],

  // Load .env files from the monorepo root
  envDir: '..',

  define: {
    // Covers both `global` and `process` references without any npm package
    global:             'globalThis',
    'process.env':      '{}',
    'process.browser':  'true',
    'process.version':  '"v18.0.0"',
  },

  resolve: {
    alias: {
      pino:   'pino/browser.js',
      '@':    path.resolve(__dirname, './src'),
      buffer: path.resolve(__dirname, './node_modules/buffer/'),
    },
    // stellar-base must be deduped alongside stellar-sdk.
    // TransactionBuilder.cloneFrom() does an instanceof Transaction check;
    // if @stellar/stellar-base loads twice the check always fails with
    // "expected a 'Transaction', got: [object Object]".
    dedupe: ['@stellar/stellar-sdk', '@stellar/stellar-base'],
  },

  optimizeDeps: {
    include: [
      '@stellar/stellar-sdk',
      '@stellar/stellar-sdk/contract',
      '@stellar/stellar-sdk/rpc',
      '@stellar/stellar-base',
      'buffer',
    ],
    exclude: [
      '@aztec/bb.js',
      '@noir-lang/noir_js',
      '@noir-lang/noirc_abi',
      '@noir-lang/acvm_js',
    ],
    esbuildOptions: {
      define: { global: 'globalThis' },
    },
  },

  build: {
    target: 'esnext',
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },

  server: {
    fs: {
      allow: ['..'],
    },
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy':   'same-origin',
    },
    port: 3000,
    open: true,
  },
});