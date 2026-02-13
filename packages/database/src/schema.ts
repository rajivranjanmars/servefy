import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// Users table for Better Auth (includes admin plugin columns)
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
  image: text('image'),
  role: text('role', { enum: ['admin', 'user'] }).notNull().default('user'),
  banned: integer('banned', { mode: 'boolean' }).default(false),
  banReason: text('ban_reason'),
  banExpires: integer('ban_expires', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// Better Auth sessions
export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// Better Auth accounts (for OAuth, though we're using email only)
export const accounts = sqliteTable('accounts', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  accessTokenExpiresAt: integer('access_token_expires_at', { mode: 'timestamp' }),
  refreshTokenExpiresAt: integer('refresh_token_expires_at', { mode: 'timestamp' }),
  scope: text('scope'),
  idToken: text('id_token'),
  password: text('password'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// Better Auth verification codes
export const verifications = sqliteTable('verifications', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
});

// Surveys
export const surveys = sqliteTable('surveys', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status', { enum: ['draft', 'published', 'closed'] }).notNull().default('draft'),
  settings: text('settings', { mode: 'json' }).notNull().default('{}'),
  branding: text('branding', { mode: 'json' }).notNull().default('{}'),
  createdBy: text('created_by').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  publishedAt: integer('published_at', { mode: 'timestamp' }),
  closedAt: integer('closed_at', { mode: 'timestamp' }),
  responseCount: integer('response_count').notNull().default(0),
});

// Questions
export const questions = sqliteTable('questions', {
  id: text('id').primaryKey(),
  surveyId: text('survey_id').notNull().references(() => surveys.id, { onDelete: 'cascade' }),
  type: text('type', {
    enum: [
      'text', 'textarea', 'email', 'phone', 'url', 'number',
      'select', 'multiselect', 'radio', 'checkbox', 'rating',
      'date', 'datetime', 'slider', 'yesno', 'matrix', 'ranking', 'file'
    ]
  }).notNull(),
  title: text('title').notNull(),
  description: text('description'),
  required: integer('required', { mode: 'boolean' }).notNull().default(false),
  order: integer('order').notNull().default(0),
  config: text('config', { mode: 'json' }).notNull().default('{}'),
  conditionalLogic: text('conditional_logic', { mode: 'json' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// Survey Responses
export const responses = sqliteTable('responses', {
  id: text('id').primaryKey(),
  surveyId: text('survey_id').notNull().references(() => surveys.id, { onDelete: 'cascade' }),
  respondentId: text('respondent_id'),
  respondentEmail: text('respondent_email'),
  startedAt: integer('started_at', { mode: 'timestamp' }).notNull(),
  submittedAt: integer('submitted_at', { mode: 'timestamp' }),
  completionTime: integer('completion_time'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  status: text('status', { enum: ['in_progress', 'completed', 'abandoned'] }).notNull().default('in_progress'),
  metadata: text('metadata', { mode: 'json' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// Answers
export const answers = sqliteTable('answers', {
  id: text('id').primaryKey(),
  responseId: text('response_id').notNull().references(() => responses.id, { onDelete: 'cascade' }),
  questionId: text('question_id').notNull().references(() => questions.id, { onDelete: 'cascade' }),
  value: text('value', { mode: 'json' }),
  fileUrl: text('file_url'),
  fileName: text('file_name'),
  fileSize: integer('file_size'),
  fileType: text('file_type'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// Files stored in R2
export const files = sqliteTable('files', {
  id: text('id').primaryKey(),
  surveyId: text('survey_id').notNull().references(() => surveys.id, { onDelete: 'cascade' }),
  responseId: text('response_id').references(() => responses.id, { onDelete: 'set null' }),
  questionId: text('question_id').references(() => questions.id, { onDelete: 'set null' }),
  fileName: text('file_name').notNull(),
  fileSize: integer('file_size').notNull(),
  fileType: text('file_type').notNull(),
  storageKey: text('storage_key').notNull().unique(),
  url: text('url').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  surveys: many(surveys),
  sessions: many(sessions),
  accounts: many(accounts),
}));

export const surveysRelations = relations(surveys, ({ one, many }) => ({
  creator: one(users, {
    fields: [surveys.createdBy],
    references: [users.id],
  }),
  questions: many(questions),
  responses: many(responses),
  files: many(files),
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
  survey: one(surveys, {
    fields: [questions.surveyId],
    references: [surveys.id],
  }),
  answers: many(answers),
  files: many(files),
}));

export const responsesRelations = relations(responses, ({ one, many }) => ({
  survey: one(surveys, {
    fields: [responses.surveyId],
    references: [surveys.id],
  }),
  answers: many(answers),
  files: many(files),
}));

export const answersRelations = relations(answers, ({ one }) => ({
  response: one(responses, {
    fields: [answers.responseId],
    references: [responses.id],
  }),
  question: one(questions, {
    fields: [answers.questionId],
    references: [questions.id],
  }),
}));

export const filesRelations = relations(files, ({ one }) => ({
  survey: one(surveys, {
    fields: [files.surveyId],
    references: [surveys.id],
  }),
  response: one(responses, {
    fields: [files.responseId],
    references: [responses.id],
  }),
  question: one(questions, {
    fields: [files.questionId],
    references: [questions.id],
  }),
}));