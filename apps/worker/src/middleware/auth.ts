import type { MiddlewareHandler } from 'hono';
import type { Variables } from '../index';

export const requireAuth: MiddlewareHandler<{ Bindings: Env; Variables: Variables }> = async (c, next) => {
  const auth = c.var.auth;
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });
  
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  c.set('user', session.user);
  await next();
};

export const requireAdmin: MiddlewareHandler<{ Bindings: Env; Variables: Variables }> = async (c, next) => {
  const auth = c.var.auth;
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });
  
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  if (session.user.role !== 'admin') {
    return c.json({ error: 'Forbidden - Admin access required' }, 403);
  }
  
  c.set('user', session.user);
  await next();
};

export const optionalAuth: MiddlewareHandler<{ Bindings: Env; Variables: Variables }> = async (c, next) => {
  const auth = c.var.auth;
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });
  
  c.set('user', session?.user || null);
  await next();
};
