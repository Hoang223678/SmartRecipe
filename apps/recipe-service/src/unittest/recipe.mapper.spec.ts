import { Difficulty, RecipeStatus } from '@app/contracts';
import { toDetail, toNumber, toSummary } from '../recipe.mapper';
import { Recipe } from '../entities/recipe.entity';

describe('recipe.mapper', () => {
  const recipe = {
    id: 'r1',
    authorId: 'a1',
    authorName: 'Lan',
    title: 'Pho',
    description: 'desc',
    servings: 2,
    cookTimeMinutes: 30,
    difficulty: Difficulty.EASY,
    calories: null,
    thumbnailUrl: null,
    status: RecipeStatus.APPROVED,
    avgRating: '4.20',
    ratingCount: 3,
    favoriteCount: 1,
    createdAt: new Date('2026-02-01T00:00:00.000Z'),
    ingredients: [],
    steps: [],
    tags: [],
  } as unknown as Recipe;

  it('toNumber parses decimal strings', () => {
    expect(toNumber('4.50')).toBe(4.5);
    expect(toNumber(null)).toBe(0);
  });

  it('toSummary maps author snapshot', () => {
    expect(toSummary(recipe).avgRating).toBe(4.2);
    expect(toSummary(recipe).author).toEqual({
      id: 'a1',
      displayName: 'Lan',
    });
  });

  it('toDetail fails open for guests (no isFavorited)', () => {
    expect(toDetail(recipe).isFavorited).toBeUndefined();
    expect(toDetail(recipe, 'u1').isFavorited).toBe(false);
  });
});
