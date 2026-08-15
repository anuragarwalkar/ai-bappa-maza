const path = require('path');

const PORT = process.env.PORT || 3000;
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn('⚠️ WARNING: GEMINI_API_KEY is not set in environment variables!');
}

module.exports = {
  PORT,
  apiKey: apiKey || 'dummy-key',
  rootDir: path.resolve(__dirname, '../..'),
};
