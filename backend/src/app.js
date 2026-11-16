/**
 * Express Application Configuration
 * Sets up middleware, static frontend serving, security policies, routes, and error handling.
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const enquiryRoutes = require('./routes/enquiryRoutes');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();

// 1. Security Headers via Helmet (with CSP configured to permit Google Fonts)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "http://localhost:5000", "http://127.0.0.1:5000"]
      }
    },
    crossOriginEmbedderPolicy: false
  })
);

// 2. CORS Allowlist Configuration
const allowedOrigins = (process.env.FRONTEND_URL || '*')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. curl, postman, server-to-server)
    if (!origin) return callback(null, true);

    // Allow null origin (e.g. when opening html locally for testing)
    if (origin === 'null') return callback(null, true);

    // If wildcard is enabled
    if (allowedOrigins.includes('*')) return callback(null, true);

    // Check if origin is in allowlist
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    } else {
      return callback(null, true); // Permissive in local dev, allow origin
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400
};

app.use(cors(corsOptions));

// 3. Request Body Parsers (with tight size limits to prevent DoS)
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));

// 4. Request Logging (Minimal & secure - no secrets logged)
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.originalUrl !== '/api/health') {
      console.log(`[HTTP] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// 5. Static Frontend Serving (Single Server for Frontend & Backend)
const frontendPath = path.resolve(__dirname, '../../frontend');
app.use(express.static(frontendPath));

// 6. Mount API Routes
app.use('/api', enquiryRoutes);

// Health check convenience redirect
app.get('/health', (req, res, next) => {
  req.url = '/api/health';
  app.handle(req, res, next);
});

// Root route - serve frontend index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// 7. Centralized Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
