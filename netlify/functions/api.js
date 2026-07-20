const serverless = require('serverless-http');

// Lazy-load the compiled Express app so cold starts are faster
let handler;
function getHandler() {
  if (!handler) {
    // Requires `npm run build` to have compiled apps/api/src → apps/api/dist
    const app = require('../../apps/api/dist/app').default;
    handler = serverless(app);
  }
  return handler;
}

exports.handler = (event, context) => getHandler()(event, context);
