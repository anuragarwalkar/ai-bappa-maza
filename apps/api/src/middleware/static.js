const fs = require('fs');
const path = require('path');
const { rootDir } = require('../config');

function registerStaticMiddleware(app) {
  const distPath = path.join(rootDir, 'dist');
  const publicPath = path.join(rootDir, 'public');

  if (fs.existsSync(distPath)) {
    app.use(require('express').static(distPath));
  }
  app.use(require('express').static(publicPath));

  app.use((req, res) => {
    const distIndex = path.join(distPath, 'index.html');
    if (fs.existsSync(distIndex)) {
      return res.sendFile(distIndex);
    }
    res.sendFile(path.join(publicPath, 'index.html'));
  });
}

module.exports = { registerStaticMiddleware };
