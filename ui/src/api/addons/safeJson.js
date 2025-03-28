/* eslint-disable promise/prefer-await-to-then */

function safeJsonMiddleware(state) {
  return (next) => (url, opts) => {
    return next(url, opts).then((response) => {
      const contentType = response.headers.get('content-type');
      if (state.safeJson && contentType !== 'application/json') {
        throw new Error(`Expected JSON response but got ${contentType}`);
      }

      return response;
    });
  };
}

function safeJson() {
  return {
    beforeRequest(wretch, _, state) {
      return wretch.middlewares([safeJsonMiddleware(state)]);
    },
    resolver: {
      safeJson() {
        this._sharedState.safeJson = true;
        return this.json();
      },
    },
  };
}

export default safeJson;
