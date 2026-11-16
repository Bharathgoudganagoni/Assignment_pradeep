/**
 * Express Application Configuration
 * Sets up middleware, security policies, routes, and centralized error handling.
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const enquiryRoutes = require('./routes/enquiryRoutes');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();

// 1. Security Headers via Helmet
app.use(helmet());

// 2. CORS Allowlist Configuration
const allowedOrigins = (process.env.FRONTEND_URL || '*')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g., mobile apps, curl, postman, health checks)
    if (!origin) return callback(null, true);

    // If wildcard is enabled
    if (allowedOrigins.includes('*')) return callback(null, true);

    // Check if origin is in allowlist
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    } else {
      return callback(new Error(`CORS policy blocked access from origin: ${origin}`));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // Cache preflight for 24 hours
};

app.use(cors(corsOptions));

// 3. Request Body Parsers (with tight size limits to prevent DoS)
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

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

// 5. Mount API Routes
app.use('/api', enquiryRoutes);

// Root & Health Convenience Endpoints
app.get('/', (req, res) => {
  res.json({
    name: 'ENECTRON Full-Stack Enquiry Management API',
    status: 'online',
    version: '1.0.0',
    documentation: '/api/health'
  });
});

app.get('/health', (req, res, next) => {
  req.url = '/api/health';
  app.handle(req, res, next);
});

// 6. Centralized Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
