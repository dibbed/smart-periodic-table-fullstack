// Safely load environment configuration from .env if present (native Node.js 20.6+)
if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile();
  } catch {
    // Optional in production / CI container environments
  }
}

const express = require('express');
const cors = require('cors');
const path = require('node:path');
const fs = require('node:fs');
const http = require('node:http');
const { initializeDatabase, closeDatabase } = require('./db/database');
const apiRouter = require('./routes/api');

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '127.0.0.1';
const CLIENT_URL = process.env.CLIENT_URL;
const ROOT_DIR = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const DIST_DIR = path.join(ROOT_DIR, 'dist');

const app = express();

// Initialize database & auto-seed on startup
initializeDatabase();

// 1. Security & Diagnostic Headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// 2. Cross-Origin Resource Sharing (CORS)
function configureCorsOrigin(clientUrl) {
  if (!clientUrl || clientUrl.trim() === '*' || clientUrl.trim() === '') {
    return '*';
  }
  const origins = clientUrl.split(',').map(s => s.trim()).filter(Boolean);
  if (origins.length === 0 || origins.includes('*')) {
    return '*';
  }
  if (origins.length === 1) {
    return origins[0];
  }
  return (origin, callback) => {
    if (!origin || origins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  };
}

const corsOrigin = configureCorsOrigin(CLIENT_URL);
app.use(cors({
  origin: corsOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: false
}));

// 3. Request Body Parsing
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// 4. Mount API Router
app.use('/api', apiRouter);

// 5. Static Files Serving
const isProduction = process.env.NODE_ENV === 'production';
const staticOptions = {
  maxAge: '1h',
  etag: true,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    }
  }
};

if (isProduction && fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR, staticOptions));
}

if (fs.existsSync(PUBLIC_DIR)) {
  app.use(express.static(PUBLIC_DIR, staticOptions));
}

if (!isProduction && fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR, staticOptions));
}

// Root route handler
app.get('/', (req, res) => {
  const distIndex = path.join(DIST_DIR, 'index.html');
  const publicIndex = path.join(PUBLIC_DIR, 'index.html');

  if (isProduction && fs.existsSync(distIndex)) {
    return res.sendFile(distIndex);
  }
  if (fs.existsSync(publicIndex)) {
    return res.sendFile(publicIndex);
  }
  if (fs.existsSync(distIndex)) {
    return res.sendFile(distIndex);
  }
  res.status(404).send('Periodic Table client files not found.');
});

// 6. 404 Handler for Unknown API Routes
app.use('/api', (req, res) => {
  res.status(404).json({
    error: `API route not found: ${req.method} ${req.originalUrl}`
  });
});

// SPA fallback for HTML5 history client-side routing in production
if (isProduction && fs.existsSync(DIST_DIR)) {
  app.get('*', (req, res, next) => {
    const distIndex = path.join(DIST_DIR, 'index.html');
    if (fs.existsSync(distIndex)) {
      return res.sendFile(distIndex);
    }
    next();
  });
}

// 7. Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  console.error(`[Server Error] ${req.method} ${req.originalUrl}:`, err.message);

  if (res.headersSent) {
    return next(err);
  }

  res.status(status).json({
    error: err.message || 'Internal Server Error',
    status
  });
});

/**
 * Starts the HTTP server and binds graceful shutdown handlers
 */
function startServer(port = PORT, host = HOST) {
  const server = http.createServer(app);

  server.listen(port, host, () => {
    console.log('');
    console.log('=============================================');
    console.log('  Smart Periodic Table (Express + SQLite)');
    console.log(`  http://${host}:${port}`);
    console.log('  API Routes:');
    console.log('    - GET  /api/health');
    console.log('    - GET  /api/elements');
    console.log('    - GET  /api/elements/:id');
    console.log('    - GET  /api/search?q=...');
    console.log('    - GET  /api/quiz?count=10&type=mixed');
    console.log('    - POST /api/compare');
    console.log('=============================================');
    console.log('Press Ctrl+C to stop.');
    console.log('');
  });

  // Graceful shutdown listener
  let isShuttingDown = false;
  const handleShutdown = (signal) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
    server.close(() => {
      console.log('[Server] HTTP server closed.');
      try {
        closeDatabase();
        console.log('[Server] SQLite database connection closed.');
      } catch (dbErr) {
        console.error('[Server] Error closing database:', dbErr.message);
      }
      process.exit(0);
    });

    // Forced termination safeguard after 5 seconds
    setTimeout(() => {
      console.error('[Server] Forced shutdown timeout expired. Exiting.');
      process.exit(1);
    }, 5000).unref();
  };

  process.on('SIGINT', () => handleShutdown('SIGINT'));
  process.on('SIGTERM', () => handleShutdown('SIGTERM'));

  return server;
}

if (require.main === module) {
  startServer();
}

module.exports = {
  app,
  startServer
};
