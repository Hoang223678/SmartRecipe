import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.string().default('development'),
  PORT: z.coerce.number().default(3000),
  GRPC_PORT: z.coerce.number().optional(),
  JWT_SECRET: z.string().min(8).default('change-me-please-use-long-secret'),
  JWT_ACCESS_EXPIRES: z.string().default('15m'),
  JWT_REFRESH_EXPIRES: z.string().default('7d'),
  DATABASE_URL: z.string().optional(),
  RABBITMQ_URL: z.string().default('amqp://guest:guest@localhost:5673'),
  REDIS_URL: z.string().default('redis://localhost:6380'),
  AUTH_GRPC_URL: z.string().default('localhost:50051'),
  CATALOG_GRPC_URL: z.string().default('localhost:50052'),
  RECIPE_GRPC_URL: z.string().default('localhost:50053'),
  RECOMMENDATION_GRPC_URL: z.string().default('localhost:50054'),
  INTERACTION_GRPC_URL: z.string().default('localhost:50055'),
  PLANNER_GRPC_URL: z.string().default('localhost:50056'),
  MEDIA_GRPC_URL: z.string().default('localhost:50057'),
  ADMIN_EMAIL: z.string().email().default('admin@smart-recipe.local'),
  ADMIN_PASSWORD: z.string().default('Admin@123'),
});

export type AppEnv = z.infer<typeof envSchema>;

let cached: AppEnv | undefined;

export function loadEnv(overrides?: Record<string, unknown>): AppEnv {
  if (!cached) {
    cached = envSchema.parse({ ...process.env, ...overrides });
  }
  return cached;
}

export function resetEnvCache(): void {
  cached = undefined;
}
