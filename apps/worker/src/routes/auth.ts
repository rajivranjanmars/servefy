import { Hono } from 'hono';
import type { Variables } from '../index';

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// Get current user - must be before wildcard route
app.get('/me', async (c) => {
  const auth = c.var.auth;
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });
  
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  return c.json({
    user: session.user,
    session: session.session,
  });
});

// Sign out - must be before wildcard route
app.post('/signout', async (c) => {
  const auth = c.var.auth;
  await auth.api.signOut({
    headers: c.req.raw.headers,
  });
  
  return c.json({ success: true });
});

// Better Auth handlers - wildcard must be last
app.all('/*', async (c) => {
  const auth = c.var.auth;
  return auth.handler(c.req.raw);
});

export const authHandler = app;