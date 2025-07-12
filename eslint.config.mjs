import angularEslintEslintPlugin from '@angular-eslint/eslint-plugin';
import { fixupConfigRules, fixupPluginRules } from '@eslint/compat';
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import typescriptEslintEslintPlugin from '@typescript-eslint/eslint-plugin';
import { default as tsParser, default as typescriptEslintParser } from '@typescript-eslint/parser';
import _import from 'eslint-plugin-import';
import jsdoc from 'eslint-plugin-jsdoc';
import prettier from 'eslint-plugin-prettier';
import sonarjs from 'eslint-plugin-sonarjs';
import globals from 'globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },

      parser: tsParser,
    },
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: typescriptEslintParser,
      parserOptions: {
        sourceType: 'module',
      },
    },
  },
  {
    files: ['**/*.ts'],
    plugins: {
      '@angular-eslint': angularEslintEslintPlugin,
      '@typescript-eslint': typescriptEslintEslintPlugin,
      import: fixupPluginRules(_import),
      jsdoc: fixupPluginRules(jsdoc),
      '@stylistic': stylistic,
      prettier: fixupPluginRules(prettier),
      sonarjs,
    },

    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',

      parserOptions: {
        project: ['tsconfig.json'],
        tsconfigRootDir: __dirname,
      },
    },

    rules: {
      '@angular-eslint/component-selector': 'warn',
      '@angular-eslint/directive-selector': 'warn',
      '@angular-eslint/no-output-native': 'warn',
      '@angular-eslint/no-output-on-prefix': 'warn',
      '@angular-eslint/use-lifecycle-interface': 'warn',
      '@stylistic/comma-dangle': ['error', 'always-multiline'],
      '@stylistic/comma-spacing': 'error',
      '@stylistic/no-extra-semi': 'error',
      '@stylistic/quotes': [
        'error',
        'single',
        {
          avoidEscape: true,
        },
      ],
      '@stylistic/space-before-function-paren': [
        'error',
        {
          anonymous: 'always',
          named: 'never',
        },
      ],
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/ban-ts-comment': 'error',
      '@typescript-eslint/consistent-type-assertions': 'error',
      '@typescript-eslint/dot-notation': 'error',
      '@typescript-eslint/explicit-function-return-type': 'error',

      '@typescript-eslint/explicit-member-accessibility': [
        'warn',
        {
          accessibility: 'explicit',

          overrides: {
            constructors: 'no-public',
            properties: 'off',
          },
        },
      ],

      '@typescript-eslint/explicit-module-boundary-types': 'off',

      '@typescript-eslint/naming-convention': [
        'error',
        {
          custom: {
            match: true,
            regex: '^I',
          },

          format: ['PascalCase'],
          selector: 'interface',
        },
        {
          custom: {
            match: true,
            regex: '^T',
          },

          format: ['PascalCase'],
          selector: 'typeAlias',
        },
        {
          custom: {
            match: true,
            regex: '^E',
          },

          format: ['PascalCase'],
          selector: 'enum',
        },
        {
          format: ['camelCase'],
          selector: 'enumMember',
        },
        {
          selector: 'class',
          format: ['PascalCase'],
        },
      ],

      '@typescript-eslint/no-empty-function': 'error',
      '@typescript-eslint/no-empty-interface': 'error',
      '@typescript-eslint/no-inferrable-types': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/no-shadow': 'error',
      '@typescript-eslint/no-this-alias': 'error',
      '@typescript-eslint/no-unnecessary-boolean-literal-compare': 'error',
      '@typescript-eslint/no-unnecessary-type-constraint': 'error',
      '@typescript-eslint/no-unsafe-enum-comparison': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unused-expressions': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      '@typescript-eslint/non-nullable-type-assertion-style': 'error',
      '@typescript-eslint/prefer-as-const': 'error',
      '@typescript-eslint/prefer-for-of': 'error',
      '@typescript-eslint/typedef': 'error',
      '@typescript-eslint/unified-signatures': 'error',
      'sonarjs/no-unused-vars': 'off',
      'arrow-parens': 'error',
      'comma-dangle': 'off',
      'comma-spacing': 'off',
      'guard-for-in': 'error',
      'id-blacklist': 'error',
      'import/no-duplicates': 'error',
      'jsdoc/no-types': 'error',
      'jsdoc/require-jsdoc': 'off',
      'key-spacing': 'error',
      'max-lines-per-function': ['warn', 75],
      'max-params': ['warn', 5],
      'no-console': 'error',
      'no-debugger': 'error',
      'no-empty-function': 'off',
      'no-extra-semi': 'error',
      'no-fallthrough': 'error',
      'no-multi-spaces': 'error',
      'no-multiple-empty-lines': 'error',
      'no-param-reassign': 'error',
      'no-redeclare': 'error',
      'no-unused-vars': 'off',
      'no-var': 'error',
      'object-shorthand': 'error',
      'one-var': ['error', 'never'],

      'padding-line-between-statements': [
        'error',
        {
          blankLine: 'always',
          prev: '*',
          next: 'continue',
        },
        {
          blankLine: 'always',
          prev: '*',
          next: 'for',
        },
        {
          blankLine: 'always',
          prev: '*',
          next: 'if',
        },
        {
          blankLine: 'always',
          prev: '*',
          next: 'return',
        },
        {
          blankLine: 'always',
          prev: '*',
          next: 'switch',
        },
        {
          blankLine: 'always',
          prev: '*',
          next: 'throw',
        },
        {
          blankLine: 'always',
          prev: '*',
          next: 'while',
        },
        {
          blankLine: 'always',
          prev: 'for',
          next: '*',
        },
        {
          blankLine: 'always',
          prev: 'if',
          next: '*',
        },
        {
          blankLine: 'always',
          prev: 'switch',
          next: '*',
        },
        {
          blankLine: 'always',
          prev: 'throw',
          next: '*',
        },
        {
          blankLine: 'always',
          prev: 'while',
          next: '*',
        },
      ],

      'prefer-const': 'error',
      'prefer-destructuring': 'error',
      'prefer-rest-params': 'error',
      'prefer-template': 'error',
      'prettier/prettier': 'error',

      'sort-keys': [
        'warn',
        'asc',
        {
          caseSensitive: false,
          natural: true,
          minKeys: 2,
          allowLineSeparatedGroups: true,
        },
      ],

      'space-before-function-paren': 'off',
      camelcase: 'warn',
      complexity: ['error', 20],
      curly: ['error', 'multi-line'],
      eqeqeq: ['error', 'always'],
      strict: ['error', 'global'],
    },
  },
  ...fixupConfigRules(compat.extends('plugin:@angular-eslint/template/recommended', 'plugin:prettier/recommended')).map(
    (config) => ({
      ...config,
      files: ['**/*.html'],
    }),
  ),
  {
    files: ['**/*.html'],

    rules: {
      '@angular-eslint/template/eqeqeq': 'warn',
      'prettier/prettier': 'warn',
    },
  },
];
