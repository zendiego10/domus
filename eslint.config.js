import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // Ignora artefactos generados de build.
  globalIgnores(['dist']),
  {
    // Aplica esta configuracion a JS y JSX del proyecto.
    files: ['**/*.{js,jsx}'],
    extends: [
      // Reglas base de JavaScript.
      js.configs.recommended,
      // Reglas recomendadas para hooks de React.
      reactHooks.configs.flat.recommended,
      // Reglas para compatibilidad con Fast Refresh en Vite.
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      // Entorno y version del lenguaje soportada.
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // Permite ignorar variables con prefijo en mayuscula (convencion de placeholders).
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
])
