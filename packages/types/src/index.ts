// Question Types
export type QuestionType = 
  | 'text'
  | 'textarea'
  | 'email'
  | 'phone'
  | 'url'
  | 'number'
  | 'select'
  | 'multiselect'
  | 'radio'
  | 'checkbox'
  | 'rating'
  | 'date'
  | 'datetime'
  | 'slider'
  | 'yesno'
  | 'matrix'
  | 'ranking'
  | 'file';

// Question Configuration
export interface QuestionConfig {
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  options?: QuestionOption[];
  rows?: string[];
  columns?: string[];
  placeholder?: string;
  accept?: string;
  maxFileSize?: number;
  multiple?: boolean;
  scale?: { min: number; max: number; labels?: Record<string, string> };
}

export interface QuestionOption {
  id: string;
  label: string;
  value: string;
}

// Question
export interface Question {
  id: string;
  surveyId: string;
  type: QuestionType;
  title: string;
  description?: string;
  required: boolean;
  order: number;
  config: QuestionConfig;
  conditionalLogic?: ConditionalLogic;
  createdAt: string;
  updatedAt: string;
}

// Conditional Logic
export interface ConditionalLogic {
  enabled: boolean;
  conditions: Condition[];
  logic: 'and' | 'or';
  action: 'show' | 'hide';
}

export interface Condition {
  questionId: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty';
  value?: string | number | boolean | string[];
}

// Survey
export interface Survey {
  id: string;
  slug: string;
  title: string;
  description?: string;
  status: 'draft' | 'published' | 'closed';
  settings: SurveySettings;
  branding: SurveyBranding;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  closedAt?: string;
  responseCount: number;
  questions?: Question[];
}

export interface SurveySettings {
  allowMultipleResponses: boolean;
  requireAuthentication: boolean;
  showProgressBar: boolean;
  allowAnonymous: boolean;
  limitResponses?: number;
  expirationDate?: string;
  redirectUrl?: string;
  confirmationMessage?: string;
  allowEditing: boolean;
}

export interface SurveyBranding {
  logo?: string;
  primaryColor?: string;
  backgroundColor?: string;
  fontFamily?: string;
  customCss?: string;
}

// Response
export interface SurveyResponse {
  id: string;
  surveyId: string;
  respondentId?: string;
  respondentEmail?: string;
  answers: Answer[];
  startedAt: string;
  submittedAt?: string;
  completionTime?: number;
  ipAddress?: string;
  userAgent?: string;
  status: 'in_progress' | 'completed' | 'abandoned';
  metadata?: Record<string, unknown>;
}

export interface Answer {
  id: string;
  responseId: string;
  questionId: string;
  value: string | number | boolean | string[] | FileAnswer;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  createdAt: string;
}

export interface FileAnswer {
  fileId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  url: string;
}

// File
export interface StoredFile {
  id: string;
  surveyId: string;
  responseId?: string;
  questionId?: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  storageKey: string;
  url: string;
  createdAt: string;
}

// Analytics
export interface SurveyAnalytics {
  surveyId: string;
  totalResponses: number;
  completionRate: number;
  averageCompletionTime: number;
  responsesByDay: DateCount[];
  questionAnalytics: QuestionAnalytics[];
}

export interface DateCount {
  date: string;
  count: number;
}

export interface QuestionAnalytics {
  questionId: string;
  questionType: QuestionType;
  questionTitle: string;
  responseCount: number;
  skipCount: number;
  breakdown: Record<string, number>;
  averageValue?: number;
  options?: OptionAnalytics[];
}

export interface OptionAnalytics {
  optionId: string;
  label: string;
  count: number;
  percentage: number;
}

// User
export interface User {
  id: string;
  email: string;
  name?: string;
  role: 'admin' | 'user';
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

// API Types
export interface CreateSurveyRequest {
  title: string;
  description?: string;
  settings?: Partial<SurveySettings>;
  branding?: Partial<SurveyBranding>;
}

export interface UpdateSurveyRequest {
  title?: string;
  description?: string;
  status?: Survey['status'];
  settings?: Partial<SurveySettings>;
  branding?: Partial<SurveyBranding>;
}

export interface CreateQuestionRequest {
  type: QuestionType;
  title: string;
  description?: string;
  required?: boolean;
  order?: number;
  config?: QuestionConfig;
  conditionalLogic?: ConditionalLogic;
}

export interface UpdateQuestionRequest extends Partial<CreateQuestionRequest> {}

export interface SubmitResponseRequest {
  answers: Array<{
    questionId: string;
    value: unknown;
  }>;
  respondentEmail?: string;
  metadata?: Record<string, unknown>;
}

export interface FileUploadResponse {
  fileId: string;
  url: string;
  fileName: string;
  fileSize: number;
  fileType: string;
}

// Export
export interface ExportResponse {
  data: unknown[];
  format: 'csv' | 'json';
  filename: string;
}