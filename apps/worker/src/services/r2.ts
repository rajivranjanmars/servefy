import { AwsClient } from 'aws4fetch';

export interface PresignedUrlResponse {
  uploadUrl: string;
  publicUrl: string;
  key: string;
}

export class R2Service {
  private client: AwsClient;
  private endpoint: string;
  private bucketName: string;

  constructor(env: Env) {
    this.client = new AwsClient({
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    });
    this.endpoint = env.R2_ENDPOINT;
    this.bucketName = 'survey-files';
  }

  /**
   * Generate a presigned URL for direct client upload to R2
   * CRITICAL: Presigned URLs ONLY work with the S3 API domain, not custom domains
   */
  async generateUploadUrl(
    key: string,
    contentType: string,
    expirySeconds: number = 3600
  ): Promise<PresignedUrlResponse> {
    const uploadUrl = new URL(`${this.endpoint}/${this.bucketName}/${key}`);
    uploadUrl.searchParams.set('X-Amz-Expires', expirySeconds.toString());

    const signed = await this.client.sign(
      new Request(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': contentType,
        },
      }),
      { aws: { signQuery: true } }
    );

    // Public URL uses custom domain (configured separately in R2)
    const publicUrl = `${this.endpoint}/${this.bucketName}/${key}`;

    return {
      uploadUrl: signed.url,
      publicUrl,
      key,
    };
  }

  /**
   * Generate a presigned URL for downloading files
   */
  async generateDownloadUrl(
    key: string,
    filename: string,
    expirySeconds: number = 3600
  ): Promise<string> {
    const downloadUrl = new URL(`${this.endpoint}/${this.bucketName}/${key}`);
    downloadUrl.searchParams.set('X-Amz-Expires', expirySeconds.toString());
    downloadUrl.searchParams.set('response-content-disposition', `attachment; filename="${filename}"`);

    const signed = await this.client.sign(
      new Request(downloadUrl, { method: 'GET' }),
      { aws: { signQuery: true } }
    );

    return signed.url;
  }

  /**
   * Upload file directly from Worker to R2
   */
  async uploadFile(
    key: string,
    data: ReadableStream | ArrayBuffer | string,
    options: {
      contentType?: string;
      contentDisposition?: string;
      customMetadata?: Record<string, string>;
      cacheControl?: string;
    } = {}
  ): Promise<void> {
    return this.withRetry(async () => {
      const response = await fetch(`${this.endpoint}/${this.bucketName}/${key}`, {
        method: 'PUT',
        headers: {
          'Content-Type': options.contentType || 'application/octet-stream',
          ...(options.contentDisposition && { 'Content-Disposition': options.contentDisposition }),
          ...(options.cacheControl && { 'Cache-Control': options.cacheControl }),
          ...Object.entries(options.customMetadata || {}).reduce((acc, [k, v]) => ({
            ...acc,
            [`x-amz-meta-${k}`]: v,
          }), {}),
        },
        body: data,
      });

      if (!response.ok) {
        throw new Error(`R2 upload failed: ${response.status} ${response.statusText}`);
      }
    });
  }

  /**
   * Download file from R2
   */
  async downloadFile(key: string): Promise<Response> {
    return this.withRetry(async () => {
      const response = await fetch(`${this.endpoint}/${this.bucketName}/${key}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('File not found');
        }
        throw new Error(`R2 download failed: ${response.status} ${response.statusText}`);
      }

      return response;
    });
  }

  /**
   * Delete file from R2
   */
  async deleteFile(key: string): Promise<void> {
    return this.withRetry(async () => {
      const response = await fetch(`${this.endpoint}/${this.bucketName}/${key}`, {
        method: 'DELETE',
      });

      if (!response.ok && response.status !== 404) {
        throw new Error(`R2 delete failed: ${response.status} ${response.statusText}`);
      }
    });
  }

  /**
   * Batch delete files from R2 (up to 1000 keys)
   */
  async deleteFiles(keys: string[]): Promise<void> {
    if (keys.length === 0) return;
    if (keys.length > 1000) {
      throw new Error('Cannot delete more than 1000 files at once');
    }

    // Process in parallel with a limit
    const batchSize = 10;
    for (let i = 0; i < keys.length; i += batchSize) {
      const batch = keys.slice(i, i + batchSize);
      await Promise.all(batch.map(key => this.deleteFile(key)));
    }
  }

  /**
   * Retry logic for R2 operations with exponential backoff
   * Handles 5xx errors from platform outages and transient failures
   */
  private async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries = 5
  ): Promise<T> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        const message = error.message || '';

        // Check for retryable errors
        const is5xxError =
          message.includes('500') ||
          message.includes('502') ||
          message.includes('503') ||
          message.includes('504');

        const isRetryable =
          is5xxError ||
          message.includes('network') ||
          message.includes('timeout') ||
          message.includes('temporarily unavailable') ||
          message.includes('ECONNRESET');

        if (!isRetryable || attempt === maxRetries - 1) {
          throw error;
        }

        // Exponential backoff
        const delay = is5xxError
          ? Math.min(1000 * Math.pow(2, attempt), 16000)
          : Math.min(1000 * Math.pow(2, attempt), 5000);

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw new Error('Max retries exceeded');
  }
}

/**
 * Generate a safe storage key with proper organization
 */
export function generateStorageKey(
  surveyId: string,
  questionId: string,
  fileId: string,
  filename: string
): string {
  // Sanitize filename to prevent path traversal
  const sanitizedFilename = filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_');
  
  return `surveys/${surveyId}/${questionId}/${fileId}-${sanitizedFilename}`;
}

/**
 * Validate file upload request
 */
export function validateFileUpload(
  fileName: string,
  fileType: string,
  fileSize: number,
  maxSize: number = 10 * 1024 * 1024 // 10MB default
): { valid: boolean; error?: string } {
  // Check file size
  if (fileSize > maxSize) {
    return { valid: false, error: `File size exceeds ${maxSize / 1024 / 1024}MB limit` };
  }

  // Check for dangerous file types
  const dangerousExtensions = ['.exe', '.dll', '.bat', '.cmd', '.sh', '.php', '.jsp', '.asp'];
  const lowerFileName = fileName.toLowerCase();
  if (dangerousExtensions.some(ext => lowerFileName.endsWith(ext))) {
    return { valid: false, error: 'File type not allowed' };
  }

  // Validate MIME type (basic check)
  const allowedTypes = [
    'image/',
    'application/pdf',
    'text/',
    'application/msword',
    'application/vnd.openxmlformats-officedocument',
    'application/vnd.ms-excel',
    'application/vnd.ms-powerpoint',
  ];
  
  const isAllowed = allowedTypes.some(type => fileType.startsWith(type));
  if (!isAllowed && fileType !== 'application/octet-stream') {
    console.warn(`Unexpected file type: ${fileType}`);
  }

  return { valid: true };
}
