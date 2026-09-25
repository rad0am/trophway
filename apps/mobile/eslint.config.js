// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier/flat');

module.exports = defineConfig([
  expoConfig,
  // Formatting is Prettier's job (root `pnpm format`); disable conflicting stylistic rules.
  prettierConfig,
  {
    ignores: ['dist/*', 'coverage/*', '.expo/*', 'expo-env.d.ts'],
  },
]);
