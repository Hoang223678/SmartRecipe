import { Role, UserStatus } from '@app/contracts';
import { User } from './entities/user.entity';

/** Mật khẩu chung cho mọi account seed (trừ admin dùng env). */
export const SEED_USER_PASSWORD = 'Password123!';

export const SEED_CHEF_LAN_ID = '55555555-5555-4555-8555-555555555555';

export type SeedUser = Pick<
  User,
  'id' | 'email' | 'displayName' | 'role' | 'status' | 'banReason'
>;

export function seedUsers(adminEmail: string): SeedUser[] {
  return [
    {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
      email: adminEmail,
      displayName: 'System Admin',
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
      banReason: null,
    },
    {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
      email: 'moderator@smart-recipe.local',
      displayName: 'Moderator Mai',
      role: Role.MODERATOR,
      status: UserStatus.ACTIVE,
      banReason: null,
    },
    {
      id: SEED_CHEF_LAN_ID,
      email: 'chef.lan@smart-recipe.local',
      displayName: 'Chef Lan',
      role: Role.CHEF,
      status: UserStatus.ACTIVE,
      banReason: null,
    },
    {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4',
      email: 'chef.minh@smart-recipe.local',
      displayName: 'Chef Minh',
      role: Role.CHEF,
      status: UserStatus.ACTIVE,
      banReason: null,
    },
    {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5',
      email: 'user.an@smart-recipe.local',
      displayName: 'Nguyen Van An',
      role: Role.USER,
      status: UserStatus.ACTIVE,
      banReason: null,
    },
    {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa6',
      email: 'user.binh@smart-recipe.local',
      displayName: 'Tran Thi Binh',
      role: Role.USER,
      status: UserStatus.ACTIVE,
      banReason: null,
    },
    {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa7',
      email: 'user.chi@smart-recipe.local',
      displayName: 'Le Minh Chi',
      role: Role.USER,
      status: UserStatus.ACTIVE,
      banReason: null,
    },
    {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa8',
      email: 'user.dung@smart-recipe.local',
      displayName: 'Pham Dung',
      role: Role.USER,
      status: UserStatus.ACTIVE,
      banReason: null,
    },
    {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa9',
      email: 'user.ha@smart-recipe.local',
      displayName: 'Hoang Ha',
      role: Role.USER,
      status: UserStatus.ACTIVE,
      banReason: null,
    },
    {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa10',
      email: 'banned@smart-recipe.local',
      displayName: 'Banned User',
      role: Role.USER,
      status: UserStatus.BANNED,
      banReason: 'Spam recipes',
    },
  ];
}
