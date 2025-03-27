import { createConfig, detectOpts } from '@esrf/eslint-config';
import { globalIgnores } from 'eslint/config';

const opts = detectOpts(import.meta.dirname);

const config = [
  globalIgnores(['build/', 'src/components/SampleView/jsmpeg.min.js']),
  ...createConfig(opts),
  {
    rules: {
      'func-style': 'off',
      'no-shadow': 'off',
      'no-unused-vars': 'off',
      'prefer-destructuring': 'off',
      'import/no-named-as-default': 'off',
      'import/no-named-as-default-member': 'off',
      'jsx-a11y/anchor-is-valid': 'off',
      'jsx-a11y/aria-role': 'off',
      'jsx-a11y/control-has-associated-label': 'off',
      'promise/always-return': 'off',
      'react/destructuring-assignment': 'off',
      'react/jsx-no-leaked-render': 'off',
      'react/no-multi-comp': 'off',
      'react/no-unused-class-component-methods': 'off',
      'react/no-unstable-nested-components': 'off',
      'react/prop-types': 'off',
      'react/sort-comp': 'off',
      'react/static-property-placement': 'off',
      'simple-import-sort/imports': 'off',
      'unicorn/prefer-global-this': 'off',
      'unicorn/prefer-modern-math-apis': 'off',
      'unicorn/switch-case-braces': 'off',
    },
  },
];

export default config;
