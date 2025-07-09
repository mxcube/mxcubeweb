import { createConfig, detectOpts } from '@esrf/eslint-config';
import { defineConfig, globalIgnores } from 'eslint/config';

const opts = detectOpts(import.meta.dirname);

const config = defineConfig([
  globalIgnores(['build/', 'src/components/SampleView/jsmpeg.min.js']),
  ...createConfig(opts),
  {
    rules: {
      'react/prop-types': 'off', // too ambitious; better to switch to TypeScript anyway

      /* Default is "avoid", but there are lots of complicated `switch` statements,
       * notably in Redux reducers, which benefit from clear case blocks. */
      'unicorn/switch-case-braces': ['warn', 'always'],
    },
  },
]);

export default config;
