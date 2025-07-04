import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import winston from 'winston';
import { DatabaseError } from './types';

// Load environment variables
dotenv.config();

// Initialize logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Create Express app
const app: Express = express();

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI!)
  .then(() => {
    logger.info('Connected to MongoDB');
  })
  .catch((error: Error) => {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  });

// Routes
import authRoutes from './routes/auth';
import writingRoutes from './routes/writing';
import aiRoutes from './routes/ai';

app.use('/api/auth', authRoutes);
app.use('/api/writing', writingRoutes);
app.use('/api/ai', aiRoutes);

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

// Error handling middleware
app.use((err: DatabaseError, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Error:', {
    name: err.name,
    message: err.message,
    stack: err.stack,
    code: err.code
  });

  // Send appropriate error response
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.name || 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: 'The requested resource was not found'
  });
});

// Start server
const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});

// Handle unhandled rejections
process.on('unhandledRejection', (reason: Error) => {
  logger.error('Unhandled Rejection:', reason);
  server.close(() => {
    logger.error('Server closed due to unhandled rejection');
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  server.close(() => {
    logger.error('Server closed due to uncaught exception');
    process.exit(1);
  });
});

export default app;