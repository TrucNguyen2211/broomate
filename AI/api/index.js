// Vercel serverless function wrapper for Express app
// This file is used when deploying to Vercel
const app = require('../ai.js');

// Export as Vercel serverless function handler
module.exports = (req, res) => {
    // Set VERCEL env to prevent app.listen()
    process.env.VERCEL = '1';
    return app(req, res);
};

