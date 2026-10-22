import { Difficulty, RecipeStatus } from '@app/contracts';
import { Recipe } from './entities/recipe.entity';

export const SEED_RECIPE_ID = '11111111-1111-4111-8111-111111111111';
export const SEED_INGREDIENT_ID = '33333333-3333-4333-8333-333333333333';
export const SEED_TAG_ID = '44444444-4444-4444-8444-444444444444';

const CHEF_LAN = {
  authorId: '55555555-5555-4555-8555-555555555555',
  authorName: 'Chef Lan',
};
const CHEF_MINH = {
  authorId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4',
  authorName: 'Chef Minh',
};

const TAG = {
  MAIN: { id: SEED_TAG_ID, name: 'Món chính' },
  SOUP: { id: '44444444-4444-4444-8444-444444444445', name: 'Món canh' },
  APPETIZER: { id: '44444444-4444-4444-8444-444444444446', name: 'Món khai vị' },
  DESSERT: { id: '44444444-4444-4444-8444-444444444447', name: 'Tráng miệng' },
  VN: { id: '44444444-4444-4444-8444-444444444448', name: 'Việt Nam' },
  BREAKFAST: { id: '44444444-4444-4444-8444-444444444449', name: 'Ăn sáng' },
};

const ING = {
  GA: { id: SEED_INGREDIENT_ID, name: 'Thịt gà' },
  BO: { id: '33333333-3333-4333-8333-333333333334', name: 'Thịt bò' },
  HEO: { id: '33333333-3333-4333-8333-333333333335', name: 'Thịt heo' },
  TOM: { id: '33333333-3333-4333-8333-333333333336', name: 'Tôm' },
  CA: { id: '33333333-3333-4333-8333-333333333337', name: 'Cá' },
  GAO: { id: '33333333-3333-4333-8333-333333333338', name: 'Gạo' },
  BUN: { id: '33333333-3333-4333-8333-333333333339', name: 'Bún' },
  NUOC_MAM: { id: '33333333-3333-4333-8333-33333333333a', name: 'Nước mắm' },
  TOI: { id: '33333333-3333-4333-8333-33333333333b', name: 'Tỏi' },
  HANH: { id: '33333333-3333-4333-8333-33333333333c', name: 'Hành tây' },
  DAU_XANH: { id: '33333333-3333-4333-8333-33333333333d', name: 'Đậu xanh' },
};

function recipe(partial: {
  id: string;
  title: string;
  description: string;
  cookTimeMinutes: number;
  difficulty: Difficulty;
  calories: number;
  servings?: number;
  avgRating: number;
  ratingCount: number;
  favoriteCount: number;
  publishedAt: string;
  author?: { authorId: string; authorName: string };
  thumbnail?: string;
  ingredients: { id: string; name: string; quantity: number; unit: string }[];
  steps: string[];
  tags: { id: string; name: string }[];
}): Partial<Recipe> {
  const author = partial.author ?? CHEF_LAN;
  return {
    id: partial.id,
    ...author,
    title: partial.title,
    description: partial.description,
    servings: partial.servings ?? 2,
    cookTimeMinutes: partial.cookTimeMinutes,
    difficulty: partial.difficulty,
    calories: partial.calories,
    thumbnailUrl: partial.thumbnail ?? `https://cdn.example.com/${partial.id}.jpg`,
    status: RecipeStatus.APPROVED,
    avgRating: partial.avgRating,
    ratingCount: partial.ratingCount,
    favoriteCount: partial.favoriteCount,
    publishedAt: new Date(partial.publishedAt),
    ingredients: partial.ingredients.map((ing) => ({
      recipeId: partial.id,
      ingredientId: ing.id,
      ingredientName: ing.name,
      quantity: ing.quantity,
      unit: ing.unit,
      isOptional: false,
    })),
    steps: partial.steps.map((content, index) => ({
      recipeId: partial.id,
      stepOrder: index + 1,
      content,
      imageUrl: null,
    })),
    tags: partial.tags.map((tag) => ({
      recipeId: partial.id,
      tagId: tag.id,
      tagName: tag.name,
    })),
  } as Partial<Recipe>;
}

export function seedApprovedRecipes(): Partial<Recipe>[] {
  return [
    recipe({
      id: SEED_RECIPE_ID,
      title: 'Cơm gà Hội An',
      description: 'Cơm gà vàng ươm, nước mắm gừng.',
      cookTimeMinutes: 45,
      difficulty: Difficulty.MEDIUM,
      calories: 650,
      avgRating: 4.5,
      ratingCount: 12,
      favoriteCount: 8,
      publishedAt: '2026-01-01T00:00:00.000Z',
      ingredients: [
        { ...ING.GA, quantity: 400, unit: 'g' },
        { ...ING.GAO, quantity: 300, unit: 'g' },
        { ...ING.NUOC_MAM, quantity: 2, unit: 'tbsp' },
      ],
      steps: ['Luộc gà với gừng, hành.', 'Thắng mỡ gà, xới cơm.'],
      tags: [TAG.MAIN, TAG.VN],
    }),
    recipe({
      id: '11111111-1111-4111-8111-111111111112',
      title: 'Phở bò Hà Nội',
      description: 'Nước dùng xương bò ninh 8 tiếng, bánh phở mềm.',
      cookTimeMinutes: 180,
      difficulty: Difficulty.HARD,
      calories: 520,
      servings: 4,
      avgRating: 4.8,
      ratingCount: 40,
      favoriteCount: 33,
      publishedAt: '2026-01-05T00:00:00.000Z',
      author: CHEF_MINH,
      ingredients: [
        { ...ING.BO, quantity: 500, unit: 'g' },
        { ...ING.HANH, quantity: 2, unit: 'piece' },
        { ...ING.TOI, quantity: 4, unit: 'clove' },
      ],
      steps: ['Ninh xương bò.', 'Trần bánh phở, chan nước dùng.'],
      tags: [TAG.SOUP, TAG.VN],
    }),
    recipe({
      id: '11111111-1111-4111-8111-111111111113',
      title: 'Bún chả Hà Nội',
      description: 'Chả nướng than hoa, nước mắm chua ngọt.',
      cookTimeMinutes: 50,
      difficulty: Difficulty.MEDIUM,
      calories: 580,
      avgRating: 4.6,
      ratingCount: 22,
      favoriteCount: 18,
      publishedAt: '2026-01-08T00:00:00.000Z',
      ingredients: [
        { ...ING.HEO, quantity: 400, unit: 'g' },
        { ...ING.BUN, quantity: 300, unit: 'g' },
        { ...ING.NUOC_MAM, quantity: 3, unit: 'tbsp' },
      ],
      steps: ['Ướp thịt, nướng chả.', 'Pha nước chấm, ăn kèm bún.'],
      tags: [TAG.MAIN, TAG.VN],
    }),
    recipe({
      id: '11111111-1111-4111-8111-111111111114',
      title: 'Bánh mì thịt',
      description: 'Ổ nóng, pate, thịt nguội, đồ chua.',
      cookTimeMinutes: 15,
      difficulty: Difficulty.EASY,
      calories: 420,
      servings: 1,
      avgRating: 4.2,
      ratingCount: 9,
      favoriteCount: 5,
      publishedAt: '2026-01-10T00:00:00.000Z',
      author: CHEF_MINH,
      ingredients: [
        { ...ING.HEO, quantity: 80, unit: 'g' },
        { ...ING.TOI, quantity: 1, unit: 'clove' },
      ],
      steps: ['Nướng bánh mì.', 'Kẹp pate, thịt, rau.'],
      tags: [TAG.BREAKFAST, TAG.VN],
    }),
    recipe({
      id: '11111111-1111-4111-8111-111111111115',
      title: 'Canh chua cá',
      description: 'Me, thơm, bạc hà, cá lóc.',
      cookTimeMinutes: 35,
      difficulty: Difficulty.EASY,
      calories: 280,
      servings: 4,
      avgRating: 4.4,
      ratingCount: 15,
      favoriteCount: 11,
      publishedAt: '2026-01-12T00:00:00.000Z',
      ingredients: [
        { ...ING.CA, quantity: 400, unit: 'g' },
        { ...ING.TOI, quantity: 3, unit: 'clove' },
        { ...ING.NUOC_MAM, quantity: 1, unit: 'tbsp' },
      ],
      steps: ['Nấu nước me.', 'Cho cá và rau, nêm nước mắm.'],
      tags: [TAG.SOUP, TAG.VN],
    }),
    recipe({
      id: '11111111-1111-4111-8111-111111111116',
      title: 'Gỏi cuốn tôm thịt',
      description: 'Bánh tráng, tôm, thịt, bún, rau sống.',
      cookTimeMinutes: 25,
      difficulty: Difficulty.EASY,
      calories: 180,
      servings: 4,
      avgRating: 4.3,
      ratingCount: 18,
      favoriteCount: 14,
      publishedAt: '2026-01-15T00:00:00.000Z',
      ingredients: [
        { ...ING.TOM, quantity: 200, unit: 'g' },
        { ...ING.HEO, quantity: 150, unit: 'g' },
        { ...ING.BUN, quantity: 100, unit: 'g' },
      ],
      steps: ['Luộc tôm thịt.', 'Cuốn bánh tráng, chấm tương.'],
      tags: [TAG.APPETIZER, TAG.VN],
    }),
    recipe({
      id: '11111111-1111-4111-8111-111111111117',
      title: 'Cơm tấm sườn',
      description: 'Sườn nướng mật ong, bì, chả, trứng ốp.',
      cookTimeMinutes: 60,
      difficulty: Difficulty.MEDIUM,
      calories: 780,
      avgRating: 4.7,
      ratingCount: 28,
      favoriteCount: 21,
      publishedAt: '2026-01-18T00:00:00.000Z',
      author: CHEF_MINH,
      ingredients: [
        { ...ING.HEO, quantity: 350, unit: 'g' },
        { ...ING.GAO, quantity: 250, unit: 'g' },
        { ...ING.NUOC_MAM, quantity: 2, unit: 'tbsp' },
      ],
      steps: ['Ướp sườn, nướng.', 'Dọn cơm tấm, nước mắm chua ngọt.'],
      tags: [TAG.MAIN, TAG.VN],
    }),
    recipe({
      id: '11111111-1111-4111-8111-111111111118',
      title: 'Mì Quảng',
      description: 'Sợi mì vàng, tôm, thịt, đậu phộng.',
      cookTimeMinutes: 55,
      difficulty: Difficulty.MEDIUM,
      calories: 610,
      avgRating: 4.4,
      ratingCount: 16,
      favoriteCount: 10,
      publishedAt: '2026-01-20T00:00:00.000Z',
      ingredients: [
        { ...ING.TOM, quantity: 200, unit: 'g' },
        { ...ING.GA, quantity: 200, unit: 'g' },
        { ...ING.TOI, quantity: 3, unit: 'clove' },
      ],
      steps: ['Nấu nước dùng nghệ.', 'Trần mì, chan ít nước, topping.'],
      tags: [TAG.MAIN, TAG.VN],
    }),
    recipe({
      id: '11111111-1111-4111-8111-111111111119',
      title: 'Chè đậu xanh',
      description: 'Đậu xanh nấu đường, nước cốt dừa.',
      cookTimeMinutes: 20,
      difficulty: Difficulty.EASY,
      calories: 220,
      servings: 4,
      avgRating: 4.1,
      ratingCount: 7,
      favoriteCount: 4,
      publishedAt: '2026-01-22T00:00:00.000Z',
      author: CHEF_MINH,
      ingredients: [{ ...ING.DAU_XANH, quantity: 200, unit: 'g' }],
      steps: ['Ngâm đậu, nấu chín.', 'Nêm đường, chan cốt dừa.'],
      tags: [TAG.DESSERT, TAG.VN],
    }),
    recipe({
      id: '11111111-1111-4111-8111-11111111111a',
      title: 'Bò kho',
      description: 'Bò hầm sả, cà rốt, bánh mì chấm.',
      cookTimeMinutes: 120,
      difficulty: Difficulty.HARD,
      calories: 540,
      servings: 4,
      avgRating: 4.9,
      ratingCount: 31,
      favoriteCount: 27,
      publishedAt: '2026-01-25T00:00:00.000Z',
      ingredients: [
        { ...ING.BO, quantity: 700, unit: 'g' },
        { ...ING.TOI, quantity: 5, unit: 'clove' },
        { ...ING.HANH, quantity: 2, unit: 'piece' },
      ],
      steps: ['Áp chảo bò với sả.', 'Hầm mềm, ăn kèm bánh mì.'],
      tags: [TAG.MAIN, TAG.VN],
    }),
  ];
}
