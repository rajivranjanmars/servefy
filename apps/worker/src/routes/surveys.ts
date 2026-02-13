import { Hono } from 'hono';
import { eq, desc, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { surveys, questions } from '@survey/database';
import { requireAuth, optionalAuth } from '../middleware/auth';
import type { Variables } from '../index';

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// Validation schemas
const createSurveySchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  settings: z.object({
    allowMultipleResponses: z.boolean().optional(),
    requireAuthentication: z.boolean().optional(),
    showProgressBar: z.boolean().optional(),
    allowAnonymous: z.boolean().optional(),
    limitResponses: z.number().optional(),
    expirationDate: z.string().optional(),
    redirectUrl: z.string().optional(),
    confirmationMessage: z.string().optional(),
    allowEditing: z.boolean().optional(),
  }).optional(),
  branding: z.object({
    logo: z.string().optional(),
    primaryColor: z.string().optional(),
    backgroundColor: z.string().optional(),
    fontFamily: z.string().optional(),
    customCss: z.string().optional(),
  }).optional(),
});

const updateSurveySchema = createSurveySchema.partial();

// List all surveys (authenticated)
app.get('/', requireAuth, async (c) => {
  const db = c.var.db;
  const user = c.var.user!;
  
  const allSurveys = await db.query.surveys.findMany({
    where: eq(surveys.createdBy, user.id),
    orderBy: desc(surveys.createdAt),
  });
  
  return c.json({ surveys: allSurveys });
});

// Create survey
app.post('/', requireAuth, async (c) => {
  const db = c.var.db;
  const user = c.var.user!;
  
  const body = await c.req.json();
  const parsed = createSurveySchema.safeParse(body);
  
  if (!parsed.success) {
    return c.json({ error: 'Invalid input', details: parsed.error.errors }, 400);
  }
  
  const data = parsed.data;
  const now = new Date();
  const slug = nanoid(10);
  
  const newSurvey = await db.insert(surveys).values({
    id: nanoid(),
    slug,
    title: data.title,
    description: data.description,
    status: 'draft',
    settings: JSON.stringify(data.settings || {}),
    branding: JSON.stringify(data.branding || {}),
    createdBy: user.id,
    createdAt: now,
    updatedAt: now,
    responseCount: 0,
  }).returning();
  
  return c.json({ survey: newSurvey[0] }, 201);
});

// Get single survey by ID (owner only)
app.get('/:id', requireAuth, async (c) => {
  const db = c.var.db;
  const user = c.var.user!;
  const id = c.req.param('id');
  
  const survey = await db.query.surveys.findFirst({
    where: and(eq(surveys.id, id), eq(surveys.createdBy, user.id)),
    with: {
      questions: true,
    },
  });
  
  if (!survey) {
    return c.json({ error: 'Survey not found' }, 404);
  }
  
  return c.json({ survey });
});

// Update survey
app.patch('/:id', requireAuth, async (c) => {
  const db = c.var.db;
  const user = c.var.user!;
  const id = c.req.param('id');
  
  const existing = await db.query.surveys.findFirst({
    where: and(eq(surveys.id, id), eq(surveys.createdBy, user.id)),
  });
  
  if (!existing) {
    return c.json({ error: 'Survey not found' }, 404);
  }
  
  const body = await c.req.json();
  const parsed = updateSurveySchema.safeParse(body);
  
  if (!parsed.success) {
    return c.json({ error: 'Invalid input', details: parsed.error.errors }, 400);
  }
  
  const data = parsed.data;
  const now = new Date();
  
  const updates: any = {
    updatedAt: now,
  };
  
  if (data.title) updates.title = data.title;
  if (data.description !== undefined) updates.description = data.description;
  if (data.settings) updates.settings = JSON.stringify(data.settings);
  if (data.branding) updates.branding = JSON.stringify(data.branding);
  
  const updated = await db.update(surveys)
    .set(updates)
    .where(eq(surveys.id, id))
    .returning();
  
  return c.json({ survey: updated[0] });
});

// Publish survey
app.post('/:id/publish', requireAuth, async (c) => {
  const db = c.var.db;
  const user = c.var.user!;
  const id = c.req.param('id');
  
  const existing = await db.query.surveys.findFirst({
    where: and(eq(surveys.id, id), eq(surveys.createdBy, user.id)),
  });
  
  if (!existing) {
    return c.json({ error: 'Survey not found' }, 404);
  }
  
  const now = new Date();
  
  const updated = await db.update(surveys)
    .set({
      status: 'published',
      publishedAt: now,
      updatedAt: now,
    })
    .where(eq(surveys.id, id))
    .returning();
  
  return c.json({ survey: updated[0] });
});

// Close survey
app.post('/:id/close', requireAuth, async (c) => {
  const db = c.var.db;
  const user = c.var.user!;
  const id = c.req.param('id');
  
  const existing = await db.query.surveys.findFirst({
    where: and(eq(surveys.id, id), eq(surveys.createdBy, user.id)),
  });
  
  if (!existing) {
    return c.json({ error: 'Survey not found' }, 404);
  }
  
  const now = new Date();
  
  const updated = await db.update(surveys)
    .set({
      status: 'closed',
      closedAt: now,
      updatedAt: now,
    })
    .where(eq(surveys.id, id))
    .returning();
  
  return c.json({ survey: updated[0] });
});

// Delete survey
app.delete('/:id', requireAuth, async (c) => {
  const db = c.var.db;
  const user = c.var.user!;
  const id = c.req.param('id');
  
  const existing = await db.query.surveys.findFirst({
    where: and(eq(surveys.id, id), eq(surveys.createdBy, user.id)),
  });
  
  if (!existing) {
    return c.json({ error: 'Survey not found' }, 404);
  }
  
  await db.delete(surveys).where(eq(surveys.id, id));
  
  return c.json({ success: true });
});

// Public: Get survey by slug
app.get('/public/:slug', optionalAuth, async (c) => {
  const db = c.var.db;
  const slug = c.req.param('slug');
  
  const survey = await db.query.surveys.findFirst({
    where: eq(surveys.slug, slug),
    with: {
      questions: true,
    },
  });
  
  if (!survey) {
    return c.json({ error: 'Survey not found' }, 404);
  }
  
  if (survey.status !== 'published') {
    return c.json({ error: 'Survey is not available' }, 403);
  }
  
  // Check if authentication is required
  const settings = JSON.parse(survey.settings as string);
  if (settings.requireAuthentication && !c.var.user) {
    return c.json({ error: 'Authentication required' }, 401);
  }
  
  // Check expiration
  if (settings.expirationDate && new Date(settings.expirationDate) < new Date()) {
    return c.json({ error: 'Survey has expired' }, 403);
  }
  
  // Remove sensitive data
  const { settings: _, ...publicSurvey } = survey;
  
  return c.json({ 
    survey: {
      ...publicSurvey,
      questions: survey.questions.map(q => ({
        ...q,
        config: JSON.parse(q.config as string),
        conditionalLogic: q.conditionalLogic ? JSON.parse(q.conditionalLogic as string) : null,
      })),
    }
  });
});

export const surveysHandler = app;