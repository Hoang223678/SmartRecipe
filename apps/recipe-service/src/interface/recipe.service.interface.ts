import {
  IngredientOptionDto,
  RecipeDetailDto,
  RecipePageDto,
  RecipeTagDto,
  SearchRecipesQueryDto,
} from '@app/contracts';

export interface IRecipeService {
  search(query: SearchRecipesQueryDto): Promise<RecipePageDto>;
  getById(id: string, viewerId?: string): Promise<RecipeDetailDto>;
  searchIngredients(q?: string): Promise<IngredientOptionDto[]>;
  listTags(): Promise<RecipeTagDto[]>;
}
