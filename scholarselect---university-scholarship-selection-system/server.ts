import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { connectDB } from './src/server/config/db.js';
import { seedDatabaseIfEmpty } from './src/server/services/seedData.js';
import authRoutes from './src/server/routes/authRoutes.js';
import studentRoutes from './src/server/routes/studentRoutes.js';
import applicationRoutes from './src/server/routes/applicationRoutes.js';
import budgetRoutes from './src/server/routes/budgetRoutes.js';
import selectionRoutes from './src/server/routes/selectionRoutes.js';
import dashboardRoutes from './src/server/routes/dashboardRoutes.js';
import reportRoutes from './src/server/routes/reportRoutes.js';
import testRoutes from './src/server/routes/testRoutes.js';
import { errorHandler } from './src/server/middleware/errorHandler.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Core Express middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging in development
app.use((req, res, next) => {
  if (req.url.startsWith('/api/')) {
    console.log(`[HTTP] ${req.method} ${req.url}`);
  }
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/selection', selectionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/tests', testRoutes);

// Database Health endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'ScholarSelect Institutional API',
    version: '1.0.0',
    mode: process.env.NODE_ENV || 'development',
  });
});

// Mount Vite or serve static assets
async function setupViteOrStatic() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req: Request, res: Response) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    }
  }

  // Centralized Error Handler
  app.use(errorHandler);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`====================================================`);
    console.log(`🎓 ScholarSelect MERN Server Running on Port ${PORT}`);
    console.log(`   URL: http://localhost:${PORT}`);
    console.log(`   Environment: ${isProduction ? 'Production' : 'Development'}`);
    console.log(`====================================================`);
  });
}

// Bootstrap database, seed data, and start server
async function bootstrap() {
  try {
    await connectDB();
    await seedDatabaseIfEmpty();
    await setupViteOrStatic();
  } catch (err) {
    console.error('Fatal initialization error:', err);
    process.exit(1);
  }
}

bootstrap();
