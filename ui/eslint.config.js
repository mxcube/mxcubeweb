import { createConfig, detectOpts } from '@esrf/eslint-config';
import { defineConfig, globalIgnores } from 'eslint/config';

const opts = detectOpts(import.meta.dirname);

const config = defineConfig([
  globalIgnores(['build/', 'src/components/SampleView/jsmpeg.min.js']),
  ...createConfig(opts),
  {
    rules: {
      'prefer-destructuring': 'off',
      'jsx-a11y/anchor-is-valid': 'off',
      'jsx-a11y/control-has-associated-label': 'off',
      'promise/always-return': 'off',
      'react/destructuring-assignment': 'off',
      'react/jsx-no-leaked-render': 'off',
      'react/no-multi-comp': 'off',
      'react/no-unused-class-component-methods': 'off',
      'react/prop-types': 'off',

      /* Default is "avoid", but there are lots of complicated `switch` statements,
       * notably in Redux reducers, which benefit from clear case blocks. */
      'unicorn/switch-case-braces': ['warn', 'always'],
    },
  },
]);

export default config;
