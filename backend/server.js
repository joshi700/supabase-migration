import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { authMiddleware } from './middleware/auth.js';
import './config/supabase.js';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import leadRoutes from './routes/leads.js';
import uploadRoutes from './routes/upload.js';
import brokerRoutes from './routes/broker.js';
import timelineRoutes from './routes/timeline.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, message: 'Too many requests, please try again later.' });
app.use('/api/', limiter);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/health', (req, res) => {
  res.json({ status: 'OK', database: 'Supabase (PostgreSQL)', timestamp: new Date().toISOString(), environment: process.env.NODE_ENV });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/leads', authMiddleware, leadRoutes);
app.use('/api/upload', authMiddleware, uploadRoutes);
app.use('/api/broker', authMiddleware, brokerRoutes);
app.use('/api/timeline', authMiddleware, timelineRoutes);

app.use((req, res) => { res.status(404).json({ error: 'Route not found' }); });

app.use((err, req, res, next) => {
  console.error('Error:', err);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large. Maximum size is 50MB.' });
  }
  res.status(500).json({ error: 'Internal server error', message: process.env.NODE_ENV === 'development' ? err.message : undefined });
});

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║   Real Estate Broking Portal               ║
║   Powered by Supabase                      ║
╚════════════════════════════════════════════╝

🚀 Server running on port ${PORT}
📍 Environment: ${process.env.NODE_ENV || 'development'}
🔗 API: http://localhost:${PORT}
💾 Database: Supabase (PostgreSQL)
⚡ Realtime: Enabled
📱 iOS App Support: Enabled

Ready to accept requests!
  `);
});

export default app;
