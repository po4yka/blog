import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

// Note: eslint-plugin-astro is not installed; add it and extend here once
// the plugin supports eslint@10. Track: https://github.com/ota-meshi/eslint-plugin-astro/issues

export default tseslint.config(
  { ignores: ['dist', '.astro', '.claude', 'coverage'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    // Covers src/ components, admin, lib, hooks AND build-time scripts/
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
)
