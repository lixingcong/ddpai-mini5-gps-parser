import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

import { execSync } from 'child_process'
import { type GitCommitInfo } from './src/types/GitCommitInfo'

const gitCommitInfo:GitCommitInfo = {
  shortSHA: execSync('git describe --tags --always --dirty="-dev"').toString().trim(),
  //COMMIT_DATE:execSync('git log -1 --format=%cI').toString().trim(),
  commitTimestamp: 1000 * parseInt(execSync('git log -1 --format=%at').toString().trim()),
  //SHA_FULL:execSync('git rev-parse HEAD').toString().trim(),
  //COMMIT_MESSAGE:execSync('git show -s --format=%s').toString().trim()
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [
      vue(),
      vueDevTools(),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      },
    },
    server: {
      port: env.APP_PORT ? Number(env.APP_PORT) : 5173,
    },
    base: env.VITE_BASE_URL || '/',
    define: {
      _GIT_COMMIT_INFO: gitCommitInfo
    }
  }
})