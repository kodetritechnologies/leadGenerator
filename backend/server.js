import 'dotenv/config';

import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';

import connectDB from './config/db.js';
import logger from './utils/logger.js';
import { initSocket } from './sockets/socket.js';

// Route Imports
import authRoutes from './routes/auth.routes.js';
import leadRoutes from './routes/lead.routes.js';
import crmRoutes from './routes/crm.routes.js';
import aiRoutes from './routes/ai.routes.js';
import billingRoutes from './routes/billing.routes.js';
import adminRoutes from './routes/admin.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Establish Database Connection

const app = express();
const server = http.createServer(app);

// Serve static public folder
app.use('/public', express.static(path.join(__dirname, 'public')));

// Initialize Socket.io
initSocket(server);

// Middlwares
app.use(helmet({
  contentSecurityPolicy: false, // Let React apps access resources easily in dev
}));

const corsOptions = {
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/crm', crmRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/admin', adminRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'LeadBrain AI API is running healthy',
    timestamp: new Date()
  });
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'API route not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error(`Global Error handler caught: ${err.message}`, { stack: err.stack });
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`Server listening on port ${PORT}`);
});
