import { Hono } from 'hono';
import { eq, and, inArray } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { surveys, files } from '@survey/database';
import { requireAuth, optionalAuth } from '../middleware/auth';
import { R2Service, generateStorageKey, validateFileUpload } from '../services/r2';
import type { Variables } from '../index';

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// Get presigned upload URL for a file (public - for survey responses)
app.post('/upload-url/:surveyId', optionalAuth, async (c) => {
  const env = c.env;
  const surveyId = c.req.param('surveyId');
  const user = c.var.user;
  
  // Validate survey exists and is published
  const db = c.var.db;
  const survey = await db.query.surveys.findFirst({
    where: eq(surveys.id, surveyId),
  });
  
  if (!survey || survey.status !== 'published') {
    return c.json({ error: 'Survey not found or not published' }, 404);
  }
  
  const body = await c.req.json();
  
  // Validate file metadata
  const schema = z.object({
    fileName: z.string().min(1).max(255),
    fileType: z.string(),
    fileSize: z.number().max(10 * 1024 * 1024), // 10MB max
    questionId: z.string(),
  });
  
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'Invalid input', details: parsed.error.errors }, 400);
  }
  
  const { fileName, fileType, fileSize, questionId } = parsed.data;
  
  // Validate file
  const validation = validateFileUpload(fileName, fileType, fileSize);
  if (!validation.valid) {
    return c.json({ error: validation.error }, 400);
  }
  
  // Generate unique file key
  const fileId = nanoid();
  const storageKey = generateStorageKey(surveyId, questionId, fileId, fileName);
  
  // Create file record
  const now = new Date();
  await db.insert(files).values({
    id: fileId,
    surveyId,
    questionId,
    fileName,
    fileSize,
    fileType,
    storageKey,
    url: '', // Will be updated after upload
    createdAt: now,
  });
  
  // Generate presigned URL for direct upload
  const r2Service = new R2Service(env);
  const { uploadUrl, publicUrl } = await r2Service.generateUploadUrl(
    storageKey,
    fileType,
    3600 // 1 hour expiry
  );
  
  return c.json({
    fileId,
    uploadUrl,
    publicUrl,
    storageKey,
    expiresIn: 3600,
  });
});

// Direct upload endpoint (fallback for small files)
app.post('/upload/:fileId', optionalAuth, async (c) => {
  const env = c.env;
  const db = c.var.db;
  const fileId = c.req.param('fileId');
  
  const fileRecord = await db.query.files.findFirst({
    where: eq(files.id, fileId),
    with: {
      survey: true,
    },
  });
  
  if (!fileRecord) {
    return c.json({ error: 'File not found' }, 404);
  }
  
  if (fileRecord.survey.status !== 'published') {
    return c.json({ error: 'Survey is not published' }, 403);
  }
  
  const formData = await c.req.formData();
  const uploadedFile = formData.get('file') as File;
  
  if (!uploadedFile) {
    return c.json({ error: 'No file provided' }, 400);
  }
  
  // Validate file
  const validation = validateFileUpload(
    uploadedFile.name,
    uploadedFile.type,
    uploadedFile.size
  );
  if (!validation.valid) {
    return c.json({ error: validation.error }, 400);
  }
  
  // Upload to R2 with retry logic
  const r2Service = new R2Service(env);
  
  try {
    await r2Service.uploadFile(
      fileRecord.storageKey,
      await uploadedFile.arrayBuffer(),
      {
        contentType: uploadedFile.type,
        contentDisposition: `attachment; filename="${fileRecord.fileName}"`,
        customMetadata: {
          fileId,
          surveyId: fileRecord.surveyId,
          questionId: fileRecord.questionId || '',
        },
      }
    );
    
    // Generate public URL
    const publicUrl = `${env.R2_ENDPOINT}/survey-files/${fileRecord.storageKey}`;
    
    // Update file record with URL
    await db.update(files)
      .set({ url: publicUrl })
      .where(eq(files.id, fileId));
    
    return c.json({
      fileId,
      url: publicUrl,
      fileName: fileRecord.fileName,
      fileSize: fileRecord.fileSize,
      fileType: fileRecord.fileType,
    });
  } catch (error: any) {
    console.error('Upload failed:', error);
    return c.json({ error: 'Upload failed', message: error.message }, 500);
  }
});

// Download file (public) with presigned URL
app.get('/download/:fileId', async (c) => {
  const env = c.env;
  const db = c.var.db;
  const fileId = c.req.param('fileId');
  
  const fileRecord = await db.query.files.findFirst({
    where: eq(files.id, fileId),
  });
  
  if (!fileRecord) {
    return c.json({ error: 'File not found' }, 404);
  }
  
  const r2Service = new R2Service(env);
  
  try {
    // For security, generate a presigned URL with short expiry
    const downloadUrl = await r2Service.generateDownloadUrl(
      fileRecord.storageKey,
      fileRecord.fileName,
      300 // 5 minutes
    );
    
    return c.json({
      downloadUrl,
      fileName: fileRecord.fileName,
      fileSize: fileRecord.fileSize,
      expiresIn: 300,
    });
  } catch (error: any) {
    console.error('Download failed:', error);
    return c.json({ error: 'Download failed', message: error.message }, 500);
  }
});

// Direct download endpoint (streams through Worker)
app.get('/stream/:fileId', async (c) => {
  const env = c.env;
  const db = c.var.db;
  const fileId = c.req.param('fileId');
  
  const fileRecord = await db.query.files.findFirst({
    where: eq(files.id, fileId),
  });
  
  if (!fileRecord) {
    return c.json({ error: 'File not found' }, 404);
  }
  
  const r2Service = new R2Service(env);
  
  try {
    const response = await r2Service.downloadFile(fileRecord.storageKey);
    
    const headers = new Headers();
    headers.set('Content-Type', fileRecord.fileType);
    headers.set('Content-Disposition', `attachment; filename="${fileRecord.fileName}"`);
    headers.set('Cache-Control', 'private, max-age=3600');
    
    return new Response(response.body, { headers });
  } catch (error: any) {
    if (error.message === 'File not found') {
      return c.json({ error: 'File not found in storage' }, 404);
    }
    console.error('Stream failed:', error);
    return c.json({ error: 'Download failed', message: error.message }, 500);
  }
});

// List files for a survey (owner only)
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
  
  const surveyFiles = await db.query.files.findMany({
    where: eq(files.surveyId, surveyId),
  });
  
  return c.json({ files: surveyFiles });
});

// Delete file (owner only)
app.delete('/:fileId', requireAuth, async (c) => {
  const env = c.env;
  const db = c.var.db;
  const user = c.var.user!;
  const fileId = c.req.param('fileId');
  
  const fileRecord = await db.query.files.findFirst({
    where: eq(files.id, fileId),
    with: {
      survey: true,
    },
  });
  
  if (!fileRecord || fileRecord.survey.createdBy !== user.id) {
    return c.json({ error: 'File not found' }, 404);
  }
  
  const r2Service = new R2Service(env);
  
  try {
    // Delete from R2
    await r2Service.deleteFile(fileRecord.storageKey);
    
    // Delete from database
    await db.delete(files).where(eq(files.id, fileId));
    
    return c.json({ success: true });
  } catch (error: any) {
    console.error('Delete failed:', error);
    return c.json({ error: 'Delete failed', message: error.message }, 500);
  }
});

// Bulk delete files (owner only)
app.post('/bulk-delete', requireAuth, async (c) => {
  const env = c.env;
  const db = c.var.db;
  const user = c.var.user!;
  
  const body = await c.req.json();
  const schema = z.object({
    fileIds: z.array(z.string()).max(1000),
  });
  
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'Invalid input', details: parsed.error.errors }, 400);
  }
  
  const { fileIds } = parsed.data;
  
  // Get files and verify ownership
  const fileRecords = await db.query.files.findMany({
    where: inArray(files.id, fileIds),
    with: {
      survey: true,
    },
  });
  
  const authorizedFiles = fileRecords.filter((f: typeof fileRecords[0]) => f.survey.createdBy === user.id);
  
  if (authorizedFiles.length === 0) {
    return c.json({ error: 'No files found or unauthorized' }, 404);
  }
  
  const r2Service = new R2Service(env);
  
  try {
    // Delete from R2 in bulk
    const storageKeys = authorizedFiles.map((f: typeof fileRecords[0]) => f.storageKey);
    await r2Service.deleteFiles(storageKeys);
    
    // Delete from database
    const authorizedIds = authorizedFiles.map((f: typeof fileRecords[0]) => f.id);
    await db.delete(files).where(inArray(files.id, authorizedIds));
    
    return c.json({ 
      success: true, 
      deleted: authorizedIds.length,
      skipped: fileIds.length - authorizedIds.length 
    });
  } catch (error: any) {
    console.error('Bulk delete failed:', error);
    return c.json({ error: 'Bulk delete failed', message: error.message }, 500);
  }
});

export const filesHandler = app;
