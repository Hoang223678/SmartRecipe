import {
  Inject,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import { Difficulty, SERVICE_NAMES } from '@app/contracts';
import type {
  IRecipeCatalog,
  RecipeCatalogItem,
} from '../interface/recipe-catalog.interface';

interface RecipeGrpc {
  getRecipe(data: { id: string; user_id: string }): Observable<{
    id: string;
    title: string;
    thumbnail_url: string;
    cook_time_minutes: number;
    difficulty: string;
    avg_rating: number;
    rating_count: number;
    author?: { id: string; display_name: string };
    servings: number;
    ingredients?: {
      ingredient_id: string;
      name: string;
      quantity: number;
      unit: string;
    }[];
  }>;
}

@Injectable()
export class RecipeCatalogGrpc implements OnModuleInit, IRecipeCatalog {
  private svc: RecipeGrpc;

  constructor(
    @Inject(SERVICE_NAMES.RECIPE) private readonly client: ClientGrpc,
  ) {}

  onModuleInit(): void {
    this.svc = this.client.getService<RecipeGrpc>('RecipeService');
  }

  async getApproved(id: string): Promise<RecipeCatalogItem> {
    try {
      const recipe = await firstValueFrom(
        this.svc.getRecipe({ id, user_id: '' }),
      );
      return {
        id: recipe.id,
        title: recipe.title,
        thumbnailUrl: recipe.thumbnail_url || null,
        cookTimeMinutes: recipe.cook_time_minutes,
        difficulty: (recipe.difficulty as Difficulty) || Difficulty.EASY,
        avgRating: recipe.avg_rating,
        ratingCount: recipe.rating_count,
        author: {
          id: recipe.author?.id ?? '',
          displayName: recipe.author?.display_name ?? '',
        },
        servings: recipe.servings || 1,
        ingredients: (recipe.ingredients ?? []).map((item) => ({
          ingredientId: item.ingredient_id,
          name: item.name,
          quantity: Number(item.quantity),
          unit: item.unit,
        })),
      };
    } catch {
      throw new NotFoundException('Recipe not found');
    }
  }
}
