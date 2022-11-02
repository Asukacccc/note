import { defineConfig, loadEnv } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import * as path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd())
  console.log(command, mode, env)

  let config = {
    resolve: { alias: { '~': path.resolve(__dirname, './src') } },
    css: {
      preprocessorOptions: {
        scss: { charset: false, additionalData: `@import "~/styles/var.scss";` },
      },
    },

    plugins: [uni()],
  }

  if (command === 'serve') {
    // 仅开发
    return config
  } else {
    // 生产
    return config
  }
})
