const express = require('express');
const cors = require('cors');
const apiRouter = require('./routes');
const { registerStaticMiddleware } = require('./middleware/static');

function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use('/api', apiRouter);
  registerStaticMiddleware(app);

  return app;
}

module.exports = { createApp };
