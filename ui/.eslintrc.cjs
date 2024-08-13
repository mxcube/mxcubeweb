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
  rules: {
    'import/no-default-export': 'off', // too opinionated
    'import/no-unresolved': 'off', // lots of false positives (perhaps misconfigured?)
    'simple-import-sort/imports': 'off', // changes global CSS order; must migrate to CSS modules first
    'unicorn/prefer-prototype-methods': 'off', // not really more readable and makes Jest crash

    // Ternaries are sometimes more readable when `true` branch is most significant branch
    'no-negated-condition': 'off',
    'unicorn/no-negated-condition': 'off',

    // Prefer explicit, consistent return - e.g. `return undefined;`
    'unicorn/no-useless-undefined': 'off',
    'consistent-return': 'error',

    /* Forcing use of `else` for consistency with mandatory `default` clause in `switch` statements is unreasonable.
     * `if`/`else if` serves a different purpose than `switch`. */
    'sonarjs/elseif-without-else': 'off',
  },
  overrides: [
    createReactOverride({
      ...dependencies,
      rules: {
        'react/jsx-no-constructed-context-values': 'off', // too strict
        'jsx-a11y/media-has-caption': 'off', // not relevant

        'react/static-property-placement': 'off', // will not be relevant after converting to functional components
        'react/destructuring-assignment': 'off', // too many failures in React class components
        'unicorn/consistent-destructuring': 'off', // too many failures in React class components

        'jsx-a11y/anchor-is-valid': 'off', // too many failures to disable locally
        'jsx-a11y/click-events-have-key-events': 'off', // too many failures to disable locally
        'jsx-a11y/no-static-element-interactions': 'off', // too many failures to disable locally
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
    {
      files: ['cypress/**/*.js'],
      rules: {
        'testing-library/await-async-query': 'off', // Cypress has its own way of dealing with asynchronicity
        'testing-library/await-async-utils': 'off', // Cypress has its own way of dealing with asynchronicity
        'testing-library/prefer-screen-queries': 'off', // Cypress provides `cy` object instead of `screen`
        'sonarjs/no-duplicate-string': 'off', // incompatible with Cypress testing syntax
        'unicorn/numeric-separators-style': 'off', // not supported
        'promise/prefer-await-to-then': 'off', // Cypress has its own `then` command
        'promise/catch-or-return': 'off', // Cypress has its own `then` command
      },
    },
  ],
});
