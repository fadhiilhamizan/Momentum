const js = require('@eslint/js');
const globals = require('globals');
const react = require('eslint-plugin-react');
const reactHooks = require('eslint-plugin-react-hooks');

// Webpack injects these into the main process at build time.
const webpackMainGlobals = {
  MAIN_WINDOW_WEBPACK_ENTRY: 'readonly',
  MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: 'readonly',
};

// Allow the `catch (_)` / unused-`_` convention.
const unusedVars = [
  'warn',
  { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
];

module.exports = [
  {
    ignores: ['node_modules/**', '.webpack/**', 'out/**', 'dist/**', 'coverage/**', 'assets/**'],
  },
  js.configs.recommended,

  // Renderer (browser) code
  {
    files: ['src/renderer/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      // DefinePlugin replaces process.env.APP_VERSION at build time.
      globals: { ...globals.browser, process: 'readonly' },
    },
    plugins: { react, 'react-hooks': reactHooks },
    settings: { react: { version: 'detect' } },
    rules: {
      ...react.configs.flat.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/no-unescaped-entities': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'no-unused-vars': unusedVars,
      'no-empty': ['warn', { allowEmptyCatch: true }],
    },
  },

  // Shared (isomorphic) code
  {
    files: ['src/shared/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
    },
    rules: { 'no-unused-vars': unusedVars },
  },

  // Main process + build config + scripts (CommonJS/Node)
  {
    files: ['src/main/**/*.js', '*.js', 'scripts/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: { ...globals.node, ...webpackMainGlobals },
    },
    rules: {
      'no-unused-vars': unusedVars,
      'no-empty': ['warn', { allowEmptyCatch: true }],
    },
  },

  // Tests
  {
    files: ['tests/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.node, ...globals.browser },
    },
    rules: { 'no-unused-vars': unusedVars },
  },
];
