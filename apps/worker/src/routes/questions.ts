import { Hono } from 'hono';
import { eq, and, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { surveys, questions } from '@survey/database';
import { requireAuth } from '../middleware/auth';
import type { Variables } from '../index';
import type { QuestionType } from '@survey/types';

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// Validation schemas
const questionOptionSchema = z.object({
  id: z.string(),
  label: z.string(),
  value: z.string(),
});

const questionConfigSchema = z.object({
  min: z.number().optional(),
  max: z.number().optional(),
  minLength: z.number().optional(),
  maxLength: z.number().optional(),
  options: z.array(questionOptionSchema).optional(),
  rows: z.array(z.string()).optional(),
  columns: z.array(z.string()).optional(),
  placeholder: z.string().optional(),
  accept: z.string().optional(),
  maxFileSize: z.number().optional(),
  multiple: z.boolean().optional(),
  scale: z.object({
    min: z.number(),
    max: z.number(),
    labels: z.record(z.string()).optional(),
  }).optional(),
});

const conditionSchema = z.object({
  questionId: z.string(),
  operator: z.enum(['equals', 'not_equals', 'contains', 'not_contains', 'greater_than', 'less_than', 'is_empty', 'is_not_empty']),
  value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]).optional(),
});

const conditionalLogicSchema = z.object({
  enabled: z.boolean(),
  conditions: z.array(conditionSchema),
  logic: z.enum(['and', 'or']),
  action: z.enum(['show', 'hide']),
});

const createQuestionSchema = z.object({
  type: z.enum([
    'text', 'textarea', 'email', 'phone', 'url', 'number',
    'select', 'multiselect', 'radio', 'checkbox', 'rating',
    'date', 'datetime', 'slider', 'yesno', 'matrix', 'ranking', 'file'
  ]),
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  required: z.boolean().optional().default(false),
  order: z.number().optional().default(0),
  config: questionConfigSchema.optional().default({}),
  conditionalLogic: conditionalLogicSchema.optional(),
});

const updateQuestionSchema = createQuestionSchema.partial();

// List questions for a survey
app.get('/survey/:surveyId', requireAuth, async (c) => {
  const db = c.var.db;
  const user = c.var.user!;
  const surveyId = c.req.param('surveyId');
  
  // Check survey ownership
  const survey = await db.query.surveys.findFirst({
    where: and(eq(surveys.id, surveyId), eq(surveys.createdBy, user.id)),
  });
  
  if (!survey) {
    return c.json({ error: 'Survey not found' }, 404);
  }
  
  const allQuestions = await db.query.questions.findMany({
    where: eq(questions.surveyId, surveyId),
    orderBy: questions.order,
  });
  
  return c.json({ 
    questions: allQuestions.map(q => ({
      ...q,
      config: JSON.parse(q.config as string),
      conditionalLogic: q.conditionalLogic ? JSON.parse(q.conditionalLogic as string) : null,
    }))
  });
});

// Create question
app.post('/survey/:surveyId', requireAuth, async (c) => {
  const db = c.var.db;
  const user = c.var.user!;
  const surveyId = c.req.param('surveyId');
  
  // Check survey ownership
  const survey = await db.query.surveys.findFirst({
    where: and(eq(surveys.id, surveyId), eq(surveys.createdBy, user.id)),
  });
  
  if (!survey) {
    return c.json({ error: 'Survey not found' }, 404);
  }
  
  const body = await c.req.json();
  const parsed = createQuestionSchema.safeParse(body);
  
  if (!parsed.success) {
    return c.json({ error: 'Invalid input', details: parsed.error.errors }, 400);
  }
  
  const data = parsed.data;
  const now = new Date();
  
  // Get max order for positioning
  const existingQuestions = await db.query.questions.findMany({
    where: eq(questions.surveyId, surveyId),
    orderBy: desc(questions.order),
    limit: 1,
  });
  
  const order = data.order || (existingQuestions[0]?.order || 0) + 1;
  
  const newQuestion = await db.insert(questions).values({
    id: nanoid(),
    surveyId,
    type: data.type,
    title: data.title,
    description: data.description,
    required: data.required,
    order,
    config: JSON.stringify(data.config),
    conditionalLogic: data.conditionalLogic ? JSON.stringify(data.conditionalLogic) : null,
    createdAt: now,
    updatedAt: now,
  }).returning();
  
  return c.json({ 
    question: {
      ...newQuestion[0],
      config: JSON.parse(newQuestion[0].config as string),
      conditionalLogic: newQuestion[0].conditionalLogic ? JSON.parse(newQuestion[0].conditionalLogic as string) : null,
    }
  }, 201);
});

// Update question
app.patch('/:id', requireAuth, async (c) => {
  const db = c.var.db;
  const user = c.var.user!;
  const id = c.req.param('id');
  
  const existing = await db.query.questions.findFirst({
    where: eq(questions.id, id),
    with: {
      survey: true,
    },
  });
  
  if (!existing || existing.survey.createdBy !== user.id) {
    return c.json({ error: 'Question not found' }, 404);
  }
  
  const body = await c.req.json();
  const parsed = updateQuestionSchema.safeParse(body);
  
  if (!parsed.success) {
    return c.json({ error: 'Invalid input', details: parsed.error.errors }, 400);
  }
  
  const data = parsed.data;
  const now = new Date();
  
  const updates: any = {
    updatedAt: now,
  };
  
  if (data.type) updates.type = data.type;
  if (data.title) updates.title = data.title;
  if (data.description !== undefined) updates.description = data.description;
  if (data.required !== undefined) updates.required = data.required;
  if (data.order !== undefined) updates.order = data.order;
  if (data.config) updates.config = JSON.stringify(data.config);
  if (data.conditionalLogic !== undefined) {
    updates.conditionalLogic = data.conditionalLogic ? JSON.stringify(data.conditionalLogic) : null;
  }
  
  const updated = await db.update(questions)
    .set(updates)
    .where(eq(questions.id, id))
    .returning();
  
  return c.json({ 
    question: {
      ...updated[0],
      config: JSON.parse(updated[0].config as string),
      conditionalLogic: updated[0].conditionalLogic ? JSON.parse(updated[0].conditionalLogic as string) : null,
    }
  });
});

// Reorder questions
app.post('/survey/:surveyId/reorder', requireAuth, async (c) => {
  const db = c.var.db;
  const user = c.var.user!;
  const surveyId = c.req.param('surveyId');
  
  // Check survey ownership
  const survey = await db.query.surveys.findFirst({
    where: and(eq(surveys.id, surveyId), eq(surveys.createdBy, user.id)),
  });
  
  if (!survey) {
    return c.json({ error: 'Survey not found' }, 404);
  }
  
  const { questionIds }: { questionIds: string[] } = await c.req.json();
  
  if (!Array.isArray(questionIds)) {
    return c.json({ error: 'Invalid input' }, 400);
  }
  
  const now = new Date();
  
  // Update order for each question
  for (let i = 0; i < questionIds.length; i++) {
    await db.update(questions)
      .set({ order: i + 1, updatedAt: now })
      .where(eq(questions.id, questionIds[i]));
  }
  
  return c.json({ success: true });
});

// Delete question
app.delete('/:id', requireAuth, async (c) => {
  const db = c.var.db;
  const user = c.var.user!;
  const id = c.req.param('id');
  
  const existing = await db.query.questions.findFirst({
    where: eq(questions.id, id),
    with: {
      survey: true,
    },
  });
  
  if (!existing || existing.survey.createdBy !== user.id) {
    return c.json({ error: 'Question not found' }, 404);
  }
  
  await db.delete(questions).where(eq(questions.id, id));
  
  return c.json({ success: true });
});

export const questionsHandler = app;