import { Hono } from 'hono';
import { eq, desc, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { surveys, responses, answers, questions } from '@survey/database';
import { requireAuth, optionalAuth } from '../middleware/auth';
import type { Variables } from '../index';

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// Validation schema
const submitResponseSchema = z.object({
  answers: z.array(z.object({
    questionId: z.string(),
    value: z.any(),
  })),
  respondentEmail: z.string().email().optional(),
  metadata: z.record(z.unknown()).optional(),
});

// List responses for a survey (owner only)
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
  
  const allResponses = await db.query.responses.findMany({
    where: eq(responses.surveyId, surveyId),
    orderBy: desc(responses.createdAt),
    with: {
      answers: true,
    },
  });
  
  return c.json({ responses: allResponses });
});

// Get single response (owner only)
app.get('/:id', requireAuth, async (c) => {
  const db = c.var.db;
  const user = c.var.user!;
  const id = c.req.param('id');
  
  const response = await db.query.responses.findFirst({
    where: eq(responses.id, id),
    with: {
      answers: true,
      survey: true,
    },
  });
  
  if (!response || response.survey.createdBy !== user.id) {
    return c.json({ error: 'Response not found' }, 404);
  }
  
  return c.json({ response });
});

// Start a response (public)
app.post('/survey/:surveyId/start', optionalAuth, async (c) => {
  const db = c.var.db;
  const surveyId = c.req.param('surveyId');
  const user = c.var.user;
  
  const survey = await db.query.surveys.findFirst({
    where: eq(surveys.id, surveyId),
  });
  
  if (!survey || survey.status !== 'published') {
    return c.json({ error: 'Survey not found or not published' }, 404);
  }
  
  const settings = JSON.parse(survey.settings as string);
  
  // Check if authentication is required
  if (settings.requireAuthentication && !user) {
    return c.json({ error: 'Authentication required' }, 401);
  }
  
  // Check expiration
  if (settings.expirationDate && new Date(settings.expirationDate) < new Date()) {
    return c.json({ error: 'Survey has expired' }, 403);
  }
  
  // Check response limit
  if (settings.limitResponses && survey.responseCount >= settings.limitResponses) {
    return c.json({ error: 'Survey response limit reached' }, 403);
  }
  
  const now = new Date();
  const response = await db.insert(responses).values({
    id: nanoid(),
    surveyId,
    respondentId: user?.id,
    startedAt: now,
    status: 'in_progress',
    ipAddress: c.req.header('cf-connecting-ip'),
    userAgent: c.req.header('user-agent'),
    createdAt: now,
    updatedAt: now,
  }).returning();
  
  return c.json({ response: response[0] }, 201);
});

// Submit response (public)
app.post('/survey/:surveyId/submit', optionalAuth, async (c) => {
  const db = c.var.db;
  const env = c.env;
  const surveyId = c.req.param('surveyId');
  const user = c.var.user;
  
  const body = await c.req.json();
  const parsed = submitResponseSchema.safeParse(body);
  
  if (!parsed.success) {
    return c.json({ error: 'Invalid input', details: parsed.error.errors }, 400);
  }
  
  const data = parsed.data;
  
  const survey = await db.query.surveys.findFirst({
    where: eq(surveys.id, surveyId),
    with: {
      questions: true,
    },
  });
  
  if (!survey || survey.status !== 'published') {
    return c.json({ error: 'Survey not found or not published' }, 404);
  }
  
  const settings = JSON.parse(survey.settings as string);
  
  // Validate all required questions are answered
  const requiredQuestions = survey.questions.filter(q => q.required);
  const answeredQuestionIds = new Set(data.answers.map(a => a.questionId));
  
  for (const q of requiredQuestions) {
    if (!answeredQuestionIds.has(q.id)) {
      return c.json({ error: `Required question not answered: ${q.title}` }, 400);
    }
  }
  
  const now = new Date();
  const responseId = nanoid();
  
  // Create response
  const response = await db.insert(responses).values({
    id: responseId,
    surveyId,
    respondentId: user?.id,
    respondentEmail: data.respondentEmail,
    startedAt: now,
    submittedAt: now,
    completionTime: 0,
    status: 'completed',
    ipAddress: c.req.header('cf-connecting-ip'),
    userAgent: c.req.header('user-agent'),
    metadata: data.metadata ? JSON.stringify(data.metadata) : null,
    createdAt: now,
    updatedAt: now,
  }).returning();
  
  // Create answers
  for (const answer of data.answers) {
    const question = survey.questions.find(q => q.id === answer.questionId);
    if (question) {
      await db.insert(answers).values({
        id: nanoid(),
        responseId,
        questionId: answer.questionId,
        value: answer.value !== undefined ? JSON.stringify(answer.value) : null,
        createdAt: now,
      });
    }
  }
  
  // Update response count
  await db.update(surveys)
    .set({ 
      responseCount: survey.responseCount + 1,
      updatedAt: now,
    })
    .where(eq(surveys.id, surveyId));
  
  return c.json({ response: response[0] }, 201);
});

// Export responses as CSV (owner only)
app.get('/survey/:surveyId/export', requireAuth, async (c) => {
  const db = c.var.db;
  const user = c.var.user!;
  const surveyId = c.req.param('surveyId');
  const format = c.req.query('format') || 'csv';
  
  // Check survey ownership
  const survey = await db.query.surveys.findFirst({
    where: and(eq(surveys.id, surveyId), eq(surveys.createdBy, user.id)),
    with: {
      questions: true,
    },
  });
  
  if (!survey) {
    return c.json({ error: 'Survey not found' }, 404);
  }
  
  const allResponses = await db.query.responses.findMany({
    where: eq(responses.surveyId, surveyId),
    with: {
      answers: true,
    },
  });
  
  if (format === 'json') {
    return c.json({ 
      survey: { title: survey.title, id: survey.id },
      responses: allResponses 
    });
  }
  
  // Generate CSV
  const headers = ['Response ID', 'Submitted At', 'Respondent Email', 'Status', ...survey.questions.map(q => q.title)];
  const rows = allResponses.map(r => {
    const row: (string | number | null)[] = [
      r.id,
      r.submittedAt ? new Date(r.submittedAt).toISOString() : '',
      r.respondentEmail || '',
      r.status,
    ];
    
    for (const q of survey.questions) {
      const answer = r.answers.find(a => a.questionId === q.id);
      if (answer?.value) {
        try {
          const value = JSON.parse(answer.value as string);
          row.push(Array.isArray(value) ? value.join(', ') : String(value));
        } catch {
          row.push(String(answer.value));
        }
      } else {
        row.push('');
      }
    }
    
    return row;
  });
  
  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');
  
  return new Response(csvContent, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${survey.title}-responses.csv"`,
    },
  });
});

export const responsesHandler = app;