import vue from 'eslint-plugin-vue'
import globals from 'globals'

export default [
  {
    ignores: [
      'build/**',
      'node_modules/**',
      'webui/dist/**',
      'webui/welcome.html',
    ],
  },
  ...vue.configs['flat/base'],
  {
    files: ['webui/**/*.{js,vue}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      'no-undef': 'error',
    },
  },
  {
    files: ['webui/**/*.{js,vue}'],
    ignores: [
      'webui/scripts/**/*.js',
      'webui/tests/**/*.js',
    ],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },
  {
    files: ['webui/utils/fileSelection.js'],
    languageOptions: {
      globals: {
        process: 'readonly',
      },
    },
  },
  {
    files: [
      'webui/scripts/**/*.js',
      'webui/tests/**/*.js',
    ],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
]
