import { CommentStatus, ReportReason, ReportStatus, ReportTargetType, Role } from '@app/contracts';

export const SEED_RECIPE_ID = '11111111-1111-4111-8111-111111111111';
export const SEED_RECIPE_PHO = '11111111-1111-4111-8111-111111111112';
export const SEED_USER_AN = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5';
export const SEED_USER_BINH = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa6';
export const SEED_CHEF_LAN = '55555555-5555-4555-8555-555555555555';
export const SEED_COLLECTION_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1';
export const SEED_COMMENT_ID = 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1';

export function seedFavorites() {
  return [
    { userId: SEED_USER_AN, recipeId: SEED_RECIPE_ID },
    { userId: SEED_USER_BINH, recipeId: SEED_RECIPE_ID },
    { userId: SEED_USER_AN, recipeId: SEED_RECIPE_PHO },
  ];
}

export function seedRatings() {
  return [
    { userId: SEED_USER_AN, recipeId: SEED_RECIPE_ID, score: 5 },
    { userId: SEED_USER_BINH, recipeId: SEED_RECIPE_ID, score: 4 },
    { userId: SEED_CHEF_LAN, recipeId: SEED_RECIPE_PHO, score: 5 },
  ];
}

export function seedCollections() {
  return [
    {
      id: SEED_COLLECTION_ID,
      userId: SEED_USER_AN,
      name: 'Món cuối tuần',
      isPublic: false,
      recipes: [{ collectionId: SEED_COLLECTION_ID, recipeId: SEED_RECIPE_ID }],
    },
  ];
}

export function seedComments() {
  const comments = [
    {
      id: SEED_COMMENT_ID,
      recipeId: SEED_RECIPE_ID,
      userId: SEED_USER_AN,
      authorName: 'Nguyen Van An',
      authorRole: Role.USER,
      parentId: null as string | null,
      content: 'Cơm gà rất ngon, sẽ nấu lại.',
      status: CommentStatus.VISIBLE,
    },
  ];
  for (let i = 2; i <= 10; i++) {
    comments.push({
      id: `cccccccc-cccc-4ccc-8ccc-cccccccccc${i.toString().padStart(2, '0')}`,
      recipeId: SEED_RECIPE_ID,
      userId: i % 2 === 0 ? SEED_USER_BINH : SEED_USER_AN,
      authorName: i % 2 === 0 ? 'Tran Thi Binh' : 'Nguyen Van An',
      authorRole: Role.USER,
      parentId: i === 3 ? SEED_COMMENT_ID : null,
      content: `Bình luận mẫu ${i} cho test.`,
      status: CommentStatus.VISIBLE,
    });
  }
  return comments;
}

export function seedReports() {
  return [
    {
      reporterId: SEED_USER_BINH,
      targetType: ReportTargetType.COMMENT,
      targetId: SEED_COMMENT_ID,
      reason: ReportReason.SPAM,
      note: 'Seed report',
      status: ReportStatus.OPEN,
    },
  ];
}
