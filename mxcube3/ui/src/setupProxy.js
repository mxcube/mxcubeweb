const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/mxcube/api',
    createProxyMiddleware({
      target: 'http://localhost:8081',
      xfwd: true
    })
  );
  app.use(
    '/socket.io/*',
    createProxyMiddleware({
      target: 'http://localhost:8081',
      xfwd: true
    })
  );
};

