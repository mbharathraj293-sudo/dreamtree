import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRouter from './routes/api.js';
import { xssSanitizer } from './middleware/security.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 1. SECURITY MIDDLEWARES
// Helmet sets secure headers
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "default-src": ["'self'"],
      "script-src": ["'self'", "'unsafe-inline'", "https://unpkg.com", "https://cdn.jsdelivr.net"],
      "connect-src": ["'self'", "https://api.unsplash.com", "https://fonts.googleapis.com"],
      "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      "font-src": ["'self'", "https://fonts.gstatic.com"],
      "img-src": ["'self'", "data:", "https:", "blob:"],
      "frame-src": ["'self'", "https://www.google.com"]
    }
  }
}));

// CORS setup
const corsOptions = {
  origin: '*', // Whitelists all for local dev, can lock to client domains
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
app.use(cors(corsOptions));

// Rate limiting (max 150 requests per 10 minutes)
const globalLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 150,
  message: { success: false, error: 'Too many requests. Please try again later.' }
});
app.use('/api/', globalLimiter);

// 2. PARSERS & SANITIZERS
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(xssSanitizer); // Prevent XSS vulnerabilities

// 3. API ROUTING
app.use('/api/v1', apiRouter);

// 4. STATIC FILE SERVING
const clientPath = path.join(__dirname, '../client');
const adminPath = path.join(__dirname, '../admin');

// Serve client visitor site
app.use(express.static(clientPath));

// Serve admin dashboard site
app.use('/admin', express.static(adminPath));

// 5. ROUTING FALLBACKS
// Fallback for Admin SPA routing
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(adminPath, 'index.html'));
});

// Fallback for customer website routing or 404
app.get('*', (req, res) => {
  res.sendFile(path.join(clientPath, 'index.html'));
});

// 6. ERROR HANDLER
app.use(errorHandler);

export default app;
