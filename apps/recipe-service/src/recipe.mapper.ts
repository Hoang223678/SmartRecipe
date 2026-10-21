import {
  Difficulty,
  RecipeDetailDto,
  RecipeSummaryDto,
} from '@app/contracts';
import { Recipe } from './entities/recipe.entity';

export function toNumber(value: string | number | null | undefined): number {
  if (value == null) {
    return 0;
  }
  return Number(value);
}

export function toSummary(recipe: Recipe): RecipeSummaryDto {
  return {
    id: recipe.id,
    title: recipe.title,
    thumbnailUrl: recipe.thumbnailUrl,
    cookTimeMinutes: recipe.cookTimeMinutes,
    difficulty: recipe.difficulty as Difficulty,
    avgRating: toNumber(recipe.avgRating),
    ratingCount: recipe.ratingCount,
    author: {
      id: recipe.authorId,
      displayName: recipe.authorName,
    },
  };
}

export function toDetail(
  recipe: Recipe,
  viewerId?: string,
): RecipeDetailDto {
  const steps = [...(recipe.steps ?? [])].sort(
    (a, b) => a.stepOrder - b.stepOrder,
  );
  return {
    ...toSummary(recipe),
    description: recipe.description,
    servings: recipe.servings,
    calories: recipe.calories,
    ingredients: (recipe.ingredients ?? []).map((item) => ({
      ingredientId: item.ingredientId,
      name: item.ingredientName,
      quantity: toNumber(item.quantity),
      unit: item.unit,
      optional: item.isOptional,
    })),
    steps: steps.map((step) => ({
      order: step.stepOrder,
      content: step.content,
      imageUrl: step.imageUrl,
    })),
    tags: (recipe.tags ?? []).map((tag) => ({
      id: tag.tagId,
      name: tag.tagName,
    })),
    isFavorited: viewerId ? false : undefined,
    createdAt: recipe.createdAt.toISOString(),
  };
}
