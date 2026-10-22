import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import {
  Difficulty,
  RecipeSortBy,
  SearchRecipesQueryDto,
} from '@app/contracts';
import { toRpcException } from '@app/common';
import { RecipeService } from '../recipe.service';

@Controller()
export class RecipeGrpcController {
  constructor(private readonly recipes: RecipeService) {}

  @GrpcMethod('RecipeService', 'SearchRecipes')
  async searchRecipes(data: {
    page?: number;
    limit?: number;
    q?: string;
    tag_ids?: string[];
    max_cook_time?: number;
    difficulty?: string;
    sort_by?: string;
  }) {
    try {
      const query: SearchRecipesQueryDto = {
        page: data.page || 1,
        limit: data.limit || 20,
        q: data.q || undefined,
        tagIds: data.tag_ids?.length ? data.tag_ids : undefined,
        maxCookTime: data.max_cook_time || undefined,
        difficulty: data.difficulty
          ? (data.difficulty as Difficulty)
          : undefined,
        sortBy: data.sort_by ? (data.sort_by as RecipeSortBy) : undefined,
      };
      const result = await this.recipes.search(query);
      return {
        items: result.items.map((item) => ({
          id: item.id,
          title: item.title,
          thumbnail_url: item.thumbnailUrl ?? '',
          cook_time_minutes: item.cookTimeMinutes,
          difficulty: item.difficulty,
          avg_rating: item.avgRating,
          rating_count: item.ratingCount,
          author: {
            id: item.author.id,
            display_name: item.author.displayName,
          },
        })),
        page: result.page,
        limit: result.limit,
        total: result.total,
      };
    } catch (error) {
      throw toRpcException(error);
    }
  }

  @GrpcMethod('RecipeService', 'GetRecipe')
  async getRecipe(data: { id: string; user_id?: string }) {
    try {
      const recipe = await this.recipes.getById(
        data.id,
        data.user_id || undefined,
      );
      return {
        id: recipe.id,
        title: recipe.title,
        thumbnail_url: recipe.thumbnailUrl ?? '',
        cook_time_minutes: recipe.cookTimeMinutes,
        difficulty: recipe.difficulty,
        avg_rating: recipe.avgRating,
        rating_count: recipe.ratingCount,
        author: {
          id: recipe.author.id,
          display_name: recipe.author.displayName,
        },
        description: recipe.description,
        servings: recipe.servings,
        calories: recipe.calories ?? 0,
        ingredients: recipe.ingredients.map((item) => ({
          ingredient_id: item.ingredientId,
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          optional: item.optional ?? false,
        })),
        steps: recipe.steps.map((step) => ({
          order: step.order,
          content: step.content,
          image_url: step.imageUrl ?? '',
        })),
        tags: recipe.tags.map((tag) => ({ id: tag.id, name: tag.name })),
        is_favorited: recipe.isFavorited ?? false,
        has_favorite: recipe.isFavorited != null,
        created_at: recipe.createdAt,
      };
    } catch (error) {
      throw toRpcException(error);
    }
  }

  @GrpcMethod('RecipeService', 'SearchIngredients')
  async searchIngredients(data: { q?: string }) {
    try {
      const items = await this.recipes.searchIngredients(data.q);
      return { items };
    } catch (error) {
      throw toRpcException(error);
    }
  }

  @GrpcMethod('RecipeService', 'ListTags')
  async listTags() {
    try {
      const items = await this.recipes.listTags();
      return { items };
    } catch (error) {
      throw toRpcException(error);
    }
  }
}
