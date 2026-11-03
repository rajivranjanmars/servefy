interface Env {
  DB: D1Database;
  STORAGE: R2Bucket;
  ENVIRONMENT: string;
  TRUSTED_ORIGINS?: string;
  BETTER_AUTH_URL?: string;
  BETTER_AUTH_SECRET: string;
  FRONTEND_URL?: string;
  R2_ENDPOINT: string;
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
}
