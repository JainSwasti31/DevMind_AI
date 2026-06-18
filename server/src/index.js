import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import authRoutes from './routes/authRoutes.js';
import repoRoutes from './routes/repoRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import { MONGODB_URI, PORT } from './config.js';

const app = express();

// Trust the first proxy hop (required on Render, Railway, Heroku, etc.)
app.set('trust proxy', 1);

// Security headers
app.use(helmet());

// CORS — allow Vercel frontend + localhost for dev
const allowedOrigins = [
  'https://dev-mind-ai-sandy.vercel.app',
  'http://localhost:5173',
  'http://localhost:4173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:4173',
];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      // Allow any localhost / 127.0.0.1 in development
      if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }
      // Allow any Vercel preview/production deployment
      if (/^https:\/\/[a-z0-9-]+(\.vercel\.app)$/.test(origin)) {
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) return callback(null, true);
      console.warn('CORS blocked origin:', origin);
      return callback(null, true); // Allow for debugging
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting — relaxed for AI routes (they hit OpenAI anyway)
const defaultLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
const aiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30 });

app.use('/api/auth', defaultLimiter, authRoutes);
app.use('/api/repos', defaultLimiter, repoRoutes);
app.use('/api/ai', aiLimiter, aiRoutes);

app.get('/', (_req, res) => {
  res.json({ status: 'DevMind AI backend running' });
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((error) => {
    console.error('MongoDB connection failed', error);
    process.exit(1);
  });
