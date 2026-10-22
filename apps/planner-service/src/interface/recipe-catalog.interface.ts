import { Difficulty, RecipeSummaryDto } from '@app/contracts';

export const RECIPE_CATALOG = 'RECIPE_CATALOG';

export type RecipeCatalogItem = RecipeSummaryDto & {
  servings: number;
  ingredients: {
    ingredientId: string;
    name: string;
    quantity: number;
    unit: string;
  }[];
};

export interface IRecipeCatalog {
  getApproved(id: string): Promise<RecipeCatalogItem>;
}

export function emptyRecipeSummary(
  id: string,
  title: string,
  thumbnailUrl: string | null,
): RecipeSummaryDto {
  return {
    id,
    title,
    thumbnailUrl,
    cookTimeMinutes: 0,
    difficulty: Difficulty.EASY,
    avgRating: 0,
    ratingCount: 0,
    author: { id: '', displayName: '' },
  };
}
