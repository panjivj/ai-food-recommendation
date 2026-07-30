import {
  vueTsConfigs,
  withVueTs,
} from '@vue/eslint-config-typescript'
import pluginVue from 'eslint-plugin-vue'

export default withVueTs(
  {
    ignores: [
      'android/**',
      'coverage/**',
      'dist/**',
      'ios/**',
      'node_modules/**',
      'tests/e2e/screenshots/**',
      'tests/e2e/videos/**',
    ],
  },
  pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'vue/no-deprecated-slot-attribute': 'off',
    },
  },
)
