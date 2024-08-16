# Front-end architecture

## Tooling

The front-end package manager is [pnpm](https://pnpm.io/):

- `pnpm install` - install the dependencies, updating the lockfile as needed (except when the `CI` env var is defined)
- `pnpm add [--save-dev] <pkg-name>` - [add a dependency](https://pnpm.io/cli/add)
- `pnpm why <pkg-name>` - show why a package is present in `node_modules`
- `pnpm up -L <pkg-name>` - update a package to the latest version
- `pnpm outdated` - list outdated dependencies
- `pnpm [run] <script> [--<arg>]` - run a script defined in `package.json`
- `pnpm dlx <pkg-name>` - fetch a package from the registry and run its default
  command binary (equivalent to `npx <pkg-name>`)

> You can run all `pnpm` commands from the root of the repository with `pnpm --prefix ui <cmd>`.

[Vite](https://vitejs.dev/) is used to build the project for production:

- `pnpm start` - start the development server at http://localhost:5173
- `pnpm build` - build the front-end for production into the `ui/build` folder
- `pnpm preview` - serve the production build at http://localhost:5173

The codebase is formatted with Prettier, linted with ESLint and tested with Cypress:

- `pnpm prettier` - check formatting
- `pnpm format` - fix formatting
- `pnpm eslint` - check for linting errors
- `pnpm fix` - fix linting errors
- `pnpm cypress` - open Cypress testing UI
- `pnpm e2e` - run Cypress E2E tests

### Editor integration

Most editors support fixing and formatting files automatically on save. The configuration for VSCode is provided out of the box, so all you need to do is install the recommended extensions.

## React & Bootstrap

The MXCuBE UI is developed in [React](https://react.dev/) with the [Bootstrap](https://getbootstrap.com/) UI toolkit (more specifically its React integration, [React Bootstrap](https://react-bootstrap.github.io/)).

While you'll still see a lot of class-based components in the codebase, please strive to use [function components](https://react.dev/learn#components) instead when implementing new features or refactoring existing code.

## State management

[Redux](https://redux.js.org/) is used to manage the app's global state and [React Redux](https://react-redux.js.org/) to subscribe React components to changes in the store.

The [Redux Style Guide](https://redux.js.org/style-guide/) contains some good advice on managing state with Redux. In particular:

- Be sure to not store state in Redux if it doesn't need to be globally available to all components. Prefer local React state (i.e. `useState`) and URL state instead, and prefer managing/retrieving state higher up the component hierarchy if it needs to be passed down to multiple components.
- Do not store duplicated state, or state that can be computed from other state. Prefer creating your own custom React hooks instead (with `useSelector` + computation).

Additionally, please strive to connect to the Redux store using the React Redux [hooks API](https://react-redux.js.org/api/hooks) rather than the old `connect` API. Note that this may require converting class-based components to function components.

To debug state management issues, you can either install the [Redux devtools extension](https://github.com/reduxjs/redux-devtools/tree/main/extension#installation) or turn on [Redux logger](https://github.com/LogRocket/redux-logger) with the corresponding [environment variable](#environment-variables).

## Fetching layer

- For each back-end API called by the front-end, there is a file under `src/api/` named after that API (e.g. `beamline.js`, `login.js` ...)
- For each endpoint, there is a function in the API's front-end file dedicated to making HTTP requests to that endpoint (e.g. `fetchLoginInfo`, `sendRunBeamlineAction` ...)
  - Functions that retrieve resources are named `fetch<Something>`.
  - Functions that perform actions are named `send<DoSomething>`.
- The [wretch](https://github.com/elbywan/wretch) library is used to make HTTP requests; it is a thin wrapper around the [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API>).

## Styling

A significant amount of styling is provided by [Bootstrap](https://getbootstrap.com/). If you need to override these styles or write custom styles from scratch for a component, please use [CSS Modules](https://github.com/css-modules/css-modules).

Global styles should be avoided at all cost as they can conflict with one another and with Bootstrap's styles. They are also more difficult to maintain in the long run.

## Environment variables

Environment variables are defined in file `ui/.env`. To override them, create your own local environment file as explained in the [Vite documentation](https://vitejs.dev/guide/env-and-mode.html#env-files) – e.g. `ui/.env.local` or `ui/.env.production.local`.

The following environment variables are available:

- `VITE_REDUX_LOGGER_ENABLED`: whether to log Redux actions to the browser console (disabled by default); useful if you're unable to install the [Redux devtools](https://github.com/reduxjs/redux-devtools/tree/main/extension#installation) browser extension.
