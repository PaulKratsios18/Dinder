const globals = require('globals');
const pluginJs = require('@eslint/js');

/** @type {import('eslint').Linter.Config[]} */
module.exports = [
    {
        languageOptions: {
            globals: Object.fromEntries(
                Object.entries({ ...globals.browser, ...globals.node }).map(([key, value]) => [key.trim(), value])
            ),
            parserOptions: {
                ecmaVersion: 2021,
                sourceType: "module",
            },
        },
        rules: {
            // Enforce camelCase for variable and method names
            camelcase: ["error", { properties: "always" }],

            // Enforce 4-space indentation
            indent: ["error", 4],

            // Enforce brace style: opening brace on the same line, closing brace on a new line
            "brace-style": [
                "error",
                "1tbs",
                {
                    allowSingleLine: true,
                },
            ],

            // Ignore unused variables and labels by turning off the rule
            "no-unused-vars": "off",

            // Ignore unused labels
            "no-unused-labels": "off",
        },
    },
    {
        ...pluginJs.configs.recommended,
        rules: {
            ...pluginJs.configs.recommended.rules,
            // Override the 'no-unused-vars' rule again here just in case it's set by the recommended config
            "no-unused-vars": "off",
        },
    },
];