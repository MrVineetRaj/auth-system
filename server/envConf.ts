import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  BASE_URL: z.string().url().default('http://localhost:3000'),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  PORT: z.string().optional(),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  MONGO_URI: z.string().url(),
  JWT_SECRET: z
    .string()
    .min(32, 'JWT_SECRET must be at least 32 characters long'),
  COOKIE_NAME: z.string().default('session'),
  COOKIE_EXPIRY: z.string(),
  MAILTRAP_USER: z.string(),
  MAILTRAP_PASSWORD: z.string(),
  MAILTRAP_HOST: z.string(),
  MAILTRAP_PORT: z.string(),
  MAILTRAP_FROM_EMAIL: z.string().email(),
});

function createEnv(env: NodeJS.ProcessEnv) {
  const validationResult = envSchema.safeParse(env);

  if (!validationResult.success) {
    throw new Error(validationResult.error.message);
  }

  return validationResult.data;
}

const envConf = createEnv(process.env);

export default envConf;
