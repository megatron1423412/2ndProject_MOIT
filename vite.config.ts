import { defineConfig, loadEnv } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { naverShoppingProxy } from './server/naverShoppingProxy'
import { productQuestionRoute } from './server/productQuestionRoute'
import { telecomOllamaRoute } from './server/telecomOllamaRoute'


function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

export default defineConfig(({ mode }) => {
  const serverEnv = loadEnv(mode, process.cwd(), '')
  return {
  plugins: [
    figmaAssetResolver(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
    naverShoppingProxy({
      clientId: serverEnv.NAVER_CLIENT_ID,
      clientSecret: serverEnv.NAVER_CLIENT_SECRET,
    }),
    productQuestionRoute({ apiKey: serverEnv.OPENAI_API_KEY, embeddingModel: serverEnv.OPENAI_EMBEDDING_MODEL }),
    telecomOllamaRoute({
      ollamaUrl: serverEnv.VITE_OLLAMA_API_URL,
      ollamaModel: serverEnv.VITE_OLLAMA_MODEL,
      internetApiKey: serverEnv.VITE_INTERNET_API_KEY,
      smartchoiceApiKey: serverEnv.SMARTCHOICE_API_KEY,
      smartchoiceUrl: serverEnv.SMARTCHOICE_URL,
    }),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
  }
})
