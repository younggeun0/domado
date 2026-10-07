import js from '@eslint/js'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'
import tseslint from 'typescript-eslint'

// 웹앱(younggeun0.dev/apps/domado)과 같은 기준: 훅 규칙은 rules-of-hooks·exhaustive-deps만 적용
export default tseslint.config(
  { ignores: ['out', 'release', 'dist', 'src-tauri/target', 'src-tauri/gen'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
)
