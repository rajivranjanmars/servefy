import { Hono } from 'hono';
import { cors } from 'hono/cors';

import { createClient } from '@survey/database';
import { authHandler } from './routes/auth';
import { surveysHandler } from './routes/surveys';
import { questionsHandler } from './routes/questions';
import { responsesHandler } from './routes/responses';
import { filesHandler } from './routes/files';
import { analyticsHandler } from './routes/analytics';
import { createAuth } from './services/auth';
import type { Database } from '@survey/database';
import type { Auth } from './services/auth';

type Variables = {
  db: Database;
  auth: Auth;
  user: {
    id: string;
    email: string;
    name: string;
    emailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
    image?: string | null;
    banned?: boolean | null;
    role?: string | null;
    banReason?: string | null;
    banExpires?: Date | null;
  } | null;
};

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// CORS Configuration
const getAllowedOrigins = (env: Env) => {
  const origins = (env.TRUSTED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (origins.length === 0) {
    origins.push('http://localhost:5173', 'http://localhost:3000');
  }
  
  // Add production URL from environment if set
  if (env.BETTER_AUTH_URL && !origins.includes(env.BETTER_AUTH_URL)) {
    origins.push(env.BETTER_AUTH_URL);
  }
  
  return origins;
};

// Middleware
// app.use('*', logger()); // Disabled in production
app.use('*', cors({
  origin: (origin, c) => {
    const allowedOrigins = getAllowedOrigins(c.env);
    
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return allowedOrigins[0];
    
    // Check if origin is allowed
    if (allowedOrigins.includes(origin)) {
      return origin;
    }
    
    // In development, allow any localhost origin
    if (c.env.ENVIRONMENT === 'development' && origin?.startsWith('http://localhost')) {
      return origin;
    }
    
    // Default to first allowed origin (will likely fail the request)
    return allowedOrigins[0];
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposeHeaders: ['Content-Length', 'X-Request-Id'],
  credentials: true,
  maxAge: 86400,
}));

// Database and Auth middleware
app.use('*', async (c, next) => {
  const db = createClient(c.env.DB);
  const auth = createAuth(c.env, db);
  
  c.set('db', db);
  c.set('auth', auth);
  await next();
});

// Health check
app.get('/health', (c) => c.json({ 
  status: 'ok', 
  timestamp: new Date().toISOString(),
  environment: c.env.ENVIRONMENT,
}));

// Better Auth routes - mounted at /api/auth
app.route('/api/auth', authHandler);

// API Routes
app.route('/api/surveys', surveysHandler);
app.route('/api/questions', questionsHandler);
app.route('/api/responses', responsesHandler);
app.route('/api/files', filesHandler);
app.route('/api/analytics', analyticsHandler);

// Public survey route - Redirect to frontend
app.get('/s/:slug', (c) => {
  const slug = c.req.param('slug');
  const frontendUrl = c.env.FRONTEND_URL || c.env.BETTER_AUTH_URL || 'http://localhost:5173';
  return c.redirect(`${frontendUrl}/s/${slug}`);
});

// 404 handler
app.notFound((c) => c.json({ error: 'Not found' }, 404));

// Error handler - Production safe
app.onError((err, c) => {
  console.error('Error:', err.message, err.stack);
  return c.json({ 
    error: 'Internal server error',
    message: c.env.ENVIRONMENT === 'development' ? err.message : undefined,
  }, 500);
});

export default app;
export type { Variables };
