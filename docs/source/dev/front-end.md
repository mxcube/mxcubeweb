# Front-end architecture

## Fetching layer

- For each back-end API called by the front-end, there is a file under `src/api/` named after that API (e.g. `beamline.js`, `login.js` ...)
- For each endpoint, there is a function in the API's front-end file dedicated to making HTTP requests to that endpoint (e.g. `fetchLoginInfo`, `sendRunBeamlineAction` ...)
  - Functions that retrieve resources are named `fetch<Something>`.
  - Functions that perform actions are named `send<DoSomething>`.
- Library [wretch](https://github.com/elbywan/wretch) is used for making HTTP requests; it is a thin wrapper around the [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API>).
