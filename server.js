/**
 * Smart Periodic Table - Enterprise Application Entrypoint
 *
 * Primary root execution facade that interfaces with the modular Express backend
 * architecture defined in server/index.js.
 *
 * Responsibilities:
 * - Safely initializes environment variables (.env) using native Node.js runtime loaders.
 * - Extracts and normalizes binding configuration (PORT, HOST, NODE_ENV).
 * - Delegates execution to server/index.js startServer() during direct CLI invocations.
 * - Re-exports { app, startServer } for programmatic integration testing and PaaS platforms.
 */

// Safely load environment configuration from .env if present (native Node.js 20.6+)
if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile();
  } catch {
    // Optional in production / containerized environments where env vars are injected directly
  }
}

const { app, startServer } = require('./server/index');

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '127.0.0.1';

if (require.main === module) {
  startServer(PORT, HOST);
}

module.exports = {
  app,
  startServer
};
