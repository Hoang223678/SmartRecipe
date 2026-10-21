import { Difficulty, RecipeStatus } from '@app/contracts';
import { Recipe } from './entities/recipe.entity';

export const SEED_RECIPE_ID = '11111111-1111-4111-8111-111111111111';
export const SEED_DRAFT_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
export const SEED_INGREDIENT_ID = '33333333-3333-4333-8333-333333333333';
export const SEED_TAG_ID = '44444444-4444-4444-8444-444444444444';

export function seedApprovedRecipes(): Partial<Recipe>[] {
  return [
    {
      id: SEED_RECIPE_ID,
      authorId: '55555555-5555-4555-8555-555555555555',
      authorName: 'Chef Lan',
      title: 'Cơm gà Hội An',
      description: 'Cơm gà vàng ươm, nước mắm gừng.',
      servings: 2,
      cookTimeMinutes: 45,
      difficulty: Difficulty.MEDIUM,
      calories: 650,
      thumbnailUrl: 'https://cdn.example.com/com-ga.jpg',
      status: RecipeStatus.APPROVED,
      avgRating: 4.5,
      ratingCount: 12,
      favoriteCount: 8,
      publishedAt: new Date('2026-01-01T00:00:00.000Z'),
      ingredients: [
        {
          recipeId: SEED_RECIPE_ID,
          ingredientId: SEED_INGREDIENT_ID,
          ingredientName: 'Thịt gà',
          quantity: 400,
          unit: 'g',
          isOptional: false,
        },
      ],
      steps: [
        {
          recipeId: SEED_RECIPE_ID,
          stepOrder: 1,
          content: 'Luộc gà với gừng, hành.',
          imageUrl: null,
        },
        {
          recipeId: SEED_RECIPE_ID,
          stepOrder: 2,
          content: 'Thắng mỡ gà, xới cơm.',
          imageUrl: null,
        },
      ],
      tags: [
        {
          recipeId: SEED_RECIPE_ID,
          tagId: SEED_TAG_ID,
          tagName: 'Món chính',
        },
      ],
    } as Partial<Recipe>,
  ];
}
