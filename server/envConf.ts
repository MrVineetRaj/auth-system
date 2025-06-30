import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.string().optional(),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  MONGO_URI: z.string().url(),
  JWT_SECRET: z
    .string()
    .min(32, 'JWT_SECRET must be at least 32 characters long'),
  COOKIE_NAME: z.string().default('session'),
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
