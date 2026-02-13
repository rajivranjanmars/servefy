import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin } from 'better-auth/plugins';
import type { Database } from '@survey/database';
import { users, sessions, accounts, verifications } from '@survey/database';

// PBKDF2 password hashing — Workers-compatible (uses crypto.subtle)
const PBKDF2_ITERATIONS = 100_000;
const SALT_LENGTH = 16;
const HASH_LENGTH = 32;

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    HASH_LENGTH * 8,
  );
  return `${toHex(salt.buffer)}:${toHex(derivedBits)}`;
}

async function verifyPassword(data: {
  hash: string;
  password: string;
}): Promise<boolean> {
  const [saltHex, hashHex] = data.hash.split(':');
  if (!saltHex || !hashHex) return false;
  const salt = fromHex(saltHex);
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(data.password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    HASH_LENGTH * 8,
  );
  return toHex(derivedBits) === hashHex;
}

export function createAuth(env: Env, db: Database) {
  const trustedOrigins = (env.TRUSTED_ORIGINS || '')
    .split(',')
    .map((origin: string) => origin.trim())
    .filter(Boolean)

  if (trustedOrigins.length === 0) {
    trustedOrigins.push('http://localhost:5173', 'http://localhost:3000')
  }

  if (env.BETTER_AUTH_URL && !trustedOrigins.includes(env.BETTER_AUTH_URL)) {
    trustedOrigins.push(env.BETTER_AUTH_URL)
  }

  return betterAuth({
    appName: 'Survey Platform',
    
    database: drizzleAdapter(db, {
      provider: 'sqlite',
      schema: {
        user: users,
        session: sessions,
        account: accounts,
        verification: verifications,
      },
    }),

    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    basePath: '/api/auth',

    trustedOrigins,

    emailAndPassword: {
      enabled: true,
      autoSignIn: true,
      requireEmailVerification: false,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      password: {
        hash: hashPassword,
        verify: verifyPassword,
      },
      sendResetPassword: async ({ user, url }) => {
        // TODO: Implement SES email sending
      },
    },

    emailVerification: {
      autoSignInAfterVerification: true,
      sendOnSignUp: false,
      sendOnSignIn: false,
      sendVerificationEmail: async ({ user, url }) => {
        // TODO: Implement SES email sending
      },
    },

    advanced: {
      useSecureCookies: env.ENVIRONMENT === 'production',
      crossSubDomainCookies: {
        enabled: false,
      },
      ipAddress: {
        ipAddressHeaders: ['cf-connecting-ip', 'x-forwarded-for'],
      },
    },

    rateLimit: {
      enabled: true,
      window: 60,
      max: 100,
      storage: 'memory',
    },

    user: {
      modelName: 'user',
      changeEmail: {
        enabled: true,
      },
      deleteUser: {
        enabled: true,
      },
    },

    account: {
      modelName: 'account',
      accountLinking: {
        enabled: true,
        trustedProviders: ['email'],
      },
    },

    session: {
      modelName: 'session',
    },

    verification: {
      modelName: 'verification',
    },

    databaseHooks: {
      user: {
        create: {
          before: async (user) => {
            return {
              data: {
                ...user,
                role: 'user',
              },
            };
          },
        },
      },
    },

    plugins: [
      admin({
        adminRoles: ['admin'],
        defaultRole: 'user',
      }),
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;
export type Session = Auth['$Infer']['Session'];
export type User = Session['user'];
