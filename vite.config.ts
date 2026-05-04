import { defineConfig } from 'vite'
import path from 'path'
import { execSync } from 'node:child_process'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

function readGit(cmd: string, fallback: string) {
  try {
    return execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() || fallback
  } catch {
    return fallback
  }
}

const COMMIT_SHA =
  process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ??
  readGit('git rev-parse --short HEAD', 'dev')

const COMMIT_COUNT = readGit('git rev-list --count HEAD', '0')

const BUILD_DATE = new Date().toISOString().slice(0, 10) // YYYY-MM-DD

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],

  define: {
    __APP_VERSION__: JSON.stringify(COMMIT_SHA),
    __APP_BUILD_DATE__: JSON.stringify(BUILD_DATE),
    __APP_COMMIT_COUNT__: JSON.stringify(COMMIT_COUNT),
  },

  build: {
    // SECURITY: don't ship source maps to production — leaks internal source paths
    sourcemap: false,
    minify: 'esbuild',
    // Strip all console/debugger statements in production builds.
    target: 'es2020',
  },
  esbuild: {
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
  },
})
