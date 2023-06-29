const { createConfig } = require('eslint-config-galex/dist/createConfig');
const { getDependencies } = require('eslint-config-galex/dist/getDependencies');
const {
  createJestOverride,
} = require('eslint-config-galex/dist/overrides/jest');
const {
  createReactOverride,
} = require('eslint-config-galex/dist/overrides/react');

const dependencies = getDependencies();

module.exports = createConfig({
  cwd: __dirname,
  incrementalAdoption: true, // turn everything into a warning
  rules: {
    'unicorn/consistent-destructuring': 'off', // too many failures in React class components

    // Ternaries are sometimes more readable when `true` branch is most significant branch
    'no-negated-condition': 'off',
    'unicorn/no-negated-condition': 'off',

    // Prefer explicit, consistent return - e.g. `return undefined;`
    'unicorn/no-useless-undefined': 'off',
    'consistent-return': 'error',

    // Not really more readable and makes Jest crash
    'unicorn/prefer-prototype-methods': 'off',

    /* Forcing use of `else` for consistency with mandatory `default` clause in `switch` statements is unreasonable.
     * `if`/`else if` serves a different purpose than `switch`. */
    'sonarjs/elseif-without-else': 'off',

    // The point of `switch` is to be less verbose than if/else-if/else
    'unicorn/switch-case-braces': ['warn', 'avoid'],
  },
  overrides: [
    createReactOverride({
      ...dependencies,
      rules: {
        'react/destructuring-assignment': 'off', // too many failures in React class components
        'react/jsx-no-constructed-context-values': 'off', // too strict
      },
    }),
    createJestOverride({
      ...dependencies,
      rules: {
        'jest/no-focused-tests': 'warn', // warning instead of error
        'jest/prefer-strict-equal': 'off', // `toEqual` is shorter and sufficient in most cases
        'jest-formatting/padding-around-all': 'off', // allow writing concise two-line tests
        'jest/require-top-level-describe': 'off', // filename should already be meaningful, extra nesting is unnecessary
      },
    }),
  ],
});
