import { Hono } from 'hono';
import { eq, and, sql, count, avg } from 'drizzle-orm';
import { surveys, responses, answers, questions } from '@survey/database';
import { requireAuth } from '../middleware/auth';
import type { Variables } from '../index';
import type { QuestionType } from '@survey/types';

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// Get survey analytics (owner only)
app.get('/survey/:surveyId', requireAuth, async (c) => {
  const db = c.var.db;
  const user = c.var.user!;
  const surveyId = c.req.param('surveyId');
  
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
  
  // Get total responses
  const totalResponses = await db.select({ count: count() })
    .from(responses)
    .where(eq(responses.surveyId, surveyId));
  
  // Get completed responses
  const completedResponses = await db.select({ count: count() })
    .from(responses)
    .where(and(
      eq(responses.surveyId, surveyId),
      eq(responses.status, 'completed')
    ));
  
  // Get completion rate
  const totalCount = totalResponses[0]?.count || 0;
  const completedCount = completedResponses[0]?.count || 0;
  const completionRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  
  // Get average completion time
  const avgTimeResult = await db.select({ avg: avg(responses.completionTime) })
    .from(responses)
    .where(and(
      eq(responses.surveyId, surveyId),
      eq(responses.status, 'completed'),
      sql`${responses.completionTime} IS NOT NULL`
    ));
  
  const averageCompletionTime = Math.round(parseFloat(avgTimeResult[0]?.avg || '0'));
  
  // Get responses by day (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const responsesByDay = await db.select({
    date: sql<string>`DATE(${responses.createdAt})`,
    count: count(),
  })
    .from(responses)
    .where(and(
      eq(responses.surveyId, surveyId),
      sql`${responses.createdAt} >= ${thirtyDaysAgo.getTime()}`
    ))
    .groupBy(sql`DATE(${responses.createdAt})`)
    .orderBy(sql`DATE(${responses.createdAt})`);
  
  // Get question analytics
  const questionAnalytics = [];
  
  for (const question of survey.questions) {
    const questionResponses = await db.select({
      value: sql<string>`${answers.value}`,
      count: count(),
    })
      .from(answers)
      .where(eq(answers.questionId, question.id))
      .groupBy(answers.value);
    
    const totalQuestionResponses = questionResponses.reduce((sum, r) => sum + r.count, 0);
    
    const analytics: any = {
      questionId: question.id,
      questionType: question.type,
      questionTitle: question.title,
      responseCount: totalQuestionResponses,
      breakdown: {},
    };
    
    // Process based on question type
    switch (question.type) {
      case 'radio':
      case 'select':
      case 'checkbox':
      case 'multiselect': {
        const config = JSON.parse(question.config as string);
        const options = config.options || [];
        
        const optionCounts: Record<string, number> = {};
        for (const option of options) {
          optionCounts[option.value] = 0;
        }
        
        for (const response of questionResponses) {
          if (response.value) {
            const valueStr = String(response.value);
            try {
              const value = JSON.parse(valueStr);
              if (Array.isArray(value)) {
                for (const v of value) {
                  optionCounts[String(v)] = (optionCounts[String(v)] || 0) + response.count;
                }
              } else {
                optionCounts[String(value)] = (optionCounts[String(value)] || 0) + response.count;
              }
            } catch {
              optionCounts[valueStr] = (optionCounts[valueStr] || 0) + response.count;
            }
          }
        }
        
        analytics.options = options.map((opt: { label: string; value: string }) => ({
          optionId: opt.value,
          label: opt.label,
          count: optionCounts[opt.value] || 0,
          percentage: totalQuestionResponses > 0 
            ? Math.round(((optionCounts[opt.value] || 0) / totalQuestionResponses) * 100)
            : 0,
        }));
        break;
      }
      
      case 'rating':
      case 'slider':
      case 'number': {
        let totalValue = 0;
        let valueCount = 0;
        
        for (const response of questionResponses) {
          if (response.value) {
            const valueStr = String(response.value);
            try {
              const value = JSON.parse(valueStr);
              if (typeof value === 'number') {
                totalValue += value;
                valueCount++;
              }
            } catch {
              const num = parseFloat(valueStr);
              if (!isNaN(num)) {
                totalValue += num;
                valueCount++;
              }
            }
          }
        }
        
        analytics.averageValue = valueCount > 0 ? totalValue / valueCount : 0;
        break;
      }
      
      case 'yesno': {
        let yesCount = 0;
        let noCount = 0;
        
        for (const response of questionResponses) {
          if (response.value) {
            const valueStr = String(response.value);
            try {
              const value = JSON.parse(valueStr);
              if (value === true || value === 'yes') yesCount++;
              else if (value === false || value === 'no') noCount++;
            } catch {
              if (valueStr === 'true' || valueStr === 'yes') yesCount++;
              else if (valueStr === 'false' || valueStr === 'no') noCount++;
            }
          }
        }
        
        analytics.breakdown = {
          yes: yesCount,
          no: noCount,
        };
        break;
      }
      
      default:
        // For text and other types, just show response count
        break;
    }
    
    questionAnalytics.push(analytics);
  }
  
  return c.json({
    analytics: {
      surveyId: survey.id,
      totalResponses: totalCount,
      completedResponses: completedCount,
      completionRate: Math.round(completionRate),
      averageCompletionTime,
      responsesByDay: responsesByDay.map(r => ({
        date: r.date,
        count: r.count,
      })),
      questionAnalytics,
    },
  });
});

// Get overview stats for dashboard
app.get('/overview', requireAuth, async (c) => {
  const db = c.var.db;
  const user = c.var.user!;
  
  // Get total surveys created by user
  const totalSurveys = await db.select({ count: count() })
    .from(surveys)
    .where(eq(surveys.createdBy, user.id));
  
  // Get total responses across all surveys
  const userSurveyIds = await db.select({ id: surveys.id })
    .from(surveys)
    .where(eq(surveys.createdBy, user.id));
  
  const ids = userSurveyIds.map(s => s.id);
  
  let totalResponses = 0;
  if (ids.length > 0) {
    const responseCount = await db.select({ count: count() })
      .from(responses)
      .where(sql`${responses.surveyId} IN (${ids.join(',')})`);
    totalResponses = responseCount[0]?.count || 0;
  }
  
  // Get recent surveys with response counts
  const recentSurveys = await db.query.surveys.findMany({
    where: eq(surveys.createdBy, user.id),
    orderBy: surveys.updatedAt,
    limit: 5,
  });
  
  return c.json({
    overview: {
      totalSurveys: totalSurveys[0]?.count || 0,
      totalResponses,
      recentSurveys,
    },
  });
});

export const analyticsHandler = app;