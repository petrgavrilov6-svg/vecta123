import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import clientsRoutes from './routes/clients.js';
import dealsRoutes from './routes/deals.js';
import tasksRoutes from './routes/tasks.js';
import membersRoutes from './routes/members.js';
import chatRoutes from './routes/chat.js';
import campaignsRoutes from './routes/campaigns.js';
import integrationsRoutes from './routes/integrations.js';
import paymentsRoutes from './routes/payments.js';
import platformRoutes from './routes/platform.js';
import dashboardRoutes from './routes/dashboard.js';

dotenv.config();

const app = express();
const PORT = process.env.BACKEND_PORT || 4000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Health check
app.get('/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

// API routes
app.get('/api', (req, res) => {
  res.json({ success: true, data: { message: 'VECTA CRM API v1' } });
});

// Auth routes
app.use('/auth', authRoutes);

// Workspace routes
app.use('/workspaces/:workspaceSlug/clients', clientsRoutes);
app.use('/workspaces/:workspaceSlug/deals', dealsRoutes);
app.use('/workspaces/:workspaceSlug/tasks', tasksRoutes);
app.use('/workspaces/:workspaceSlug/members', membersRoutes);
app.use('/workspaces/:workspaceSlug/chat', chatRoutes);
app.use('/workspaces/:workspaceSlug/campaigns', campaignsRoutes);
app.use('/workspaces/:workspaceSlug/integrations', integrationsRoutes);
app.use('/workspaces/:workspaceSlug/payments', paymentsRoutes);
app.use('/workspaces/:workspaceSlug/dashboard', dashboardRoutes);

// Platform admin routes
app.use('/platform', platformRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found' } });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    },
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend API запущен на http://localhost:${PORT}`);
});

