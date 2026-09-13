const path = require('path');

const PORT = process.env.PORT || 3000;
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn('⚠️ WARNING: GEMINI_API_KEY is not set in environment variables!');
}

module.exports = {
  PORT,
  apiKey: apiKey || 'dummy-key',
  // rootDir = workspace root (ai-bappa-maza/) — 4 levels up from apps/api/src/config/
  rootDir: path.resolve(__dirname, '../../../..'),
};
