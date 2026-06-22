import { createConfig, detectOpts } from '@esrf/eslint-config';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

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
  {
    // The codebase is still being migrated to TypeScript, so run type-aware
    // linting on `.ts`/`.tsx` files only. `@esrf/eslint-config` enables the
    // type-checked rule sets on all JS/TS files.
    // This results to uncomprehensible amount of errors related to lack of typing.
    files: ['**/*.{js,jsx,cjs,mjs}'],
    extends: [tseslint.configs.disableTypeChecked],
  },
]);

export default config;
