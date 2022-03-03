const { createConfig } = require('eslint-config-galex/src/createConfig');
const { files: jestFiles } = require('eslint-config-galex/src/overrides/jest');
const {
  files: reactFiles,
} = require('eslint-config-galex/src/overrides/react');
const {
  files: tsFiles,
} = require('eslint-config-galex/src/overrides/typescript');

module.exports = createConfig({
  rules: {
    'import/order': 'off',

    'sort-keys-fix/sort-keys-fix': 'off', // keys should be sorted based on significance
    'import/no-default-export': 'off', // default exports are common in React
    'no-negated-condition': 'off', // ternaries are sometimes more readable when `true` branch is most significant branch

    // Prefer explicit, consistent return - e.g. `return undefined;`
    'unicorn/no-useless-undefined': 'off',
    'consistent-return': 'error',

    // Properties available after typeguard may be tedious to destructure (e.g. in JSX)
    'unicorn/consistent-destructuring': 'off',

    'sonarjs/no-duplicated-branches': 'warn',
    'promise/catch-or-return': 'warn',
    'import/no-anonymous-default-export': 'warn',
    'default-param-last': 'warn',
    'sonarjs/max-switch-cases': 'warn',
    'import/no-anonymous-default-export': 'warn',
    'unicorn/prefer-spread': 'warn',
    'sonarjs/no-unused-collection': 'warn',
    'sonarjs/no-identical-functions': 'warn',
    'no-prototype-builtins': 'warn',
    'sonarjs/no-duplicate-string': 'warn',
    'import/no-namespace': 'warn',
    'no-class-assign': 'warn',
    'no-invalid-this': 'warn',
    'unicorn/prefer-query-selector': 'warn',
    'no-empty-function': 'warn',
    'require-unicode-regexp': 'warn',
    'unicorn/better-regex': 'warn',
    'unicorn/no-new-array': 'warn',
    'sonarjs/prefer-object-literal': 'warn',
    'sonarjs/no-extra-arguments': 'warn',
    'array-callback-return': 'warn',
    'unicorn/no-abusive-eslint-disable': 'off',
    'no-unmodified-loop-condition': 'warn'
    
    // zustand has `whitelist` option
    // 'inclusive-language/use-inclusive-words': [
    //  'warn',
    //  { allowedTerms: ['whitelist'] },
    //],
  },
  overrides: [
    {
      files: reactFiles,
      rules: {
        'import/named': 'warn',
        'react/static-property-placement': 'warn',
        'jsx-a11y/anchor-has-content': 'warn',
        'react/static-property-placement': 'warn',
        'jsx-a11y/no-autofocus': 'warn',
        'react/jsx-handler-names': 'warn',
        'react/button-has-type': 'warn',
        'jsx-a11y/anchor-is-valid': 'warn',
        'jsx-a11y/alt-text': 'warn',
        'jsx-a11y/no-static-element-interactions': 'warn',
        'react/no-string-refs': 'warn',
        'react/no-find-dom-node': 'warn',
        'react/no-deprecated': 'warn',
        'react/destructuring-assignment': 'off',
        'react/jsx-no-constructed-context-values': 'off', // too strict
      },
    },{
      files: jestFiles,
      rules: {
        'jest/no-focused-tests': 'warn', // warning instead of error
        'jest/prefer-strict-equal': 'off', // `toEqual` is shorter and sufficient in most cases
        'jest-formatting/padding-around-all': 'off', // allow writing concise two-line tests
        'jest/require-top-level-describe': 'off', // filename should already be meaningful, extra nesting is unnecessary
      },
    },
  ],
});
