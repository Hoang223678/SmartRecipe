import { join } from 'path';

export * from './dto';
export * from './enums';
export * from './events';

export const PROTO_DIR = join(process.cwd(), 'libs/contracts/proto');

export function protoPath(fileName: string): string {
  return join(PROTO_DIR, fileName);
}

export const GRPC_PACKAGES = {
  AUTH: 'auth',
  HEALTH: 'health',
  RECIPE: 'recipe',
} as const;

export const SERVICE_NAMES = {
  AUTH: 'AUTH_GRPC',
  CATALOG: 'CATALOG_GRPC',
  RECIPE: 'RECIPE_GRPC',
  RECOMMENDATION: 'RECOMMENDATION_GRPC',
  INTERACTION: 'INTERACTION_GRPC',
  PLANNER: 'PLANNER_GRPC',
  MEDIA: 'MEDIA_GRPC',
} as const;
