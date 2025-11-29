/**
 * AI Resume Builder - Backend Server
 * 
 * Main server file that initializes Express, sets up middleware,
 * and configures all routes
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';

// Import routes
import resumeRoutes from './routes/resume.routes.js';
import aiRoutes from './routes/ai.routes.js';
import authRoutes from './routes/auth.routes.js';
import templateRoutes from './routes/template.routes.js';

// Load environment variables from backend directory
dotenv.config();

// Get directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-resume-builder';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// Middleware - CORS configuration for production
const allowedOrigins = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
  : ['http://localhost:5173'];

// Add localhost for development
if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.push('http://localhost:5173', 'http://127.0.0.1:5173');
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Not allowed by CORS. Origin: ${origin}`));
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Create necessary directories
const directories = ['uploads', 'uploads/images', 'temp'];
directories.forEach(dir => {
  const dirPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`📁 Created directory: ${dir}`);
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/templates', templateRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'AI Resume Builder API is running',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'AI Resume Builder API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      resume: {
        parse: 'POST /api/resume/parse',
        recommendLayout: 'POST /api/resume/recommend-layout',
        generate: 'POST /api/resume/generate',
        exportPdf: 'POST /api/resume/export/pdf',
        exportDocx: 'POST /api/resume/export/docx',
        improve: 'POST /api/resume/improve'
      },
      ai: {
        chat: 'POST /api/ai/chat',
        health: 'GET /api/ai/health'
      }
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log('\n🚀 AI Resume Builder Backend (Google Gemini Edition)');
  console.log('━'.repeat(50));
  console.log(`📡 Server running on: http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️  MongoDB: ${MONGODB_URI}`);
  console.log(`🔑 API Key configured: ${process.env.GEMINI_API_KEY || process.env.HUGGINGFACE_API_KEY ? '✅ Yes' : '❌ No'}`);
  console.log(`🤖 AI Model: Google Gemini 2.0 Flash Experimental`);
  console.log('━'.repeat(50));
  console.log('\n📋 Available endpoints:');
  console.log(`  GET  /health`);
  console.log(`  POST /api/auth/signup`);
  console.log(`  POST /api/auth/login`);
  console.log(`  POST /api/auth/logout`);
  console.log(`  GET  /api/auth/me`);
  console.log(`  POST /api/resume/parse`);
  console.log(`  POST /api/resume/recommend-layout`);
  console.log(`  POST /api/resume/generate`);
  console.log(`  GET  /api/resume/list (protected)`);
  console.log(`  POST /api/resume/export/pdf`);
  console.log(`  POST /api/resume/export/docx`);
  console.log(`  POST /api/resume/improve`);
  console.log(`  POST /api/ai/chat`);
  console.log(`  GET  /api/ai/health`);
  console.log('\n✨ Ready to build amazing resumes!\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n👋 SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n👋 SIGINT signal received: closing HTTP server');
  process.exit(0);
});

export default app;
