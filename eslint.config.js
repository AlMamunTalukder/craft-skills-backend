const globals = require('globals');
const pluginJs = require('@eslint/js');
const tseslint = require('typescript-eslint');

module.exports = [
    {
        ignores: ['dist/**'],
    },
    {
        files: ['**/*.ts'],
        languageOptions: {
            globals: {
                ...globals.node,
            },
            parser: tseslint.parser,
            parserOptions: {
                project: './tsconfig.json',
            },
        },
        plugins: {
            '@typescript-eslint': tseslint.plugin,
        },
        rules: {
            ...pluginJs.configs.recommended.rules,
            ...tseslint.configs.recommended.rules,
            'no-unused-vars': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unused-vars': 'off',
            '@typescript-eslint/no-namespace': 'off',
            '@typescript-eslint/explicit-function-return-type': 'off',
            '@typescript-eslint/consistent-type-imports': 'off',
            'no-console': 'warn',
            'no-useless-escape': 'off',
            'lines-between-class-members': ['error', 'always'],
            'padding-line-between-statements': [
                'error',
                { blankLine: 'always', prev: 'class', next: '*' },
                { blankLine: 'always', prev: '*', next: 'class' },
            ],
        },
    },
];
