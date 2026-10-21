import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import { SERVICE_NAMES } from '@app/contracts';

interface RecipeGrpc {
  searchRecipes(data: object): Observable<SearchReply>;
  getRecipe(data: object): Observable<GrpcRecipeDetail>;
  searchIngredients(data: object): Observable<{ items: GrpcIngredient[] }>;
  listTags(data: object): Observable<{ items: GrpcTag[] }>;
}

type GrpcAuthor = { id: string; display_name: string };

type GrpcSummary = {
  id: string;
  title: string;
  thumbnail_url: string;
  cook_time_minutes: number;
  difficulty: string;
  avg_rating: number;
  rating_count: number;
  author: GrpcAuthor;
};

type SearchReply = {
  items: GrpcSummary[];
  page: number;
  limit: number;
  total: number;
};

type GrpcIngredient = { id?: string; ingredient_id?: string; name: string; quantity?: number; unit?: string; optional?: boolean };
type GrpcTag = { id: string; name: string };

type GrpcRecipeDetail = GrpcSummary & {
  description: string;
  servings: number;
  calories: number;
  ingredients: GrpcIngredient[];
  steps: { order: number; content: string; image_url: string }[];
  tags: GrpcTag[];
  is_favorited: boolean;
  has_favorite: boolean;
  created_at: string;
};

@Injectable()
export class RecipeGrpcClient implements OnModuleInit {
  private svc: RecipeGrpc;

  constructor(
    @Inject(SERVICE_NAMES.RECIPE) private readonly client: ClientGrpc,
  ) {}

  onModuleInit(): void {
    this.svc = this.client.getService<RecipeGrpc>('RecipeService');
  }

  searchRecipes(data: object) {
    return firstValueFrom(this.svc.searchRecipes(data));
  }

  getRecipe(data: object) {
    return firstValueFrom(this.svc.getRecipe(data));
  }

  searchIngredients(data: object) {
    return firstValueFrom(this.svc.searchIngredients(data));
  }

  listTags() {
    return firstValueFrom(this.svc.listTags({}));
  }
}

export function mapSummary(item: GrpcSummary) {
  return {
    id: item.id,
    title: item.title,
    thumbnailUrl: item.thumbnail_url || null,
    cookTimeMinutes: item.cook_time_minutes,
    difficulty: item.difficulty,
    avgRating: item.avg_rating,
    ratingCount: item.rating_count,
    author: {
      id: item.author?.id,
      displayName: item.author?.display_name,
    },
  };
}

export function mapPage(res: SearchReply) {
  return {
    items: (res.items ?? []).map(mapSummary),
    page: res.page,
    limit: res.limit,
    total: res.total,
  };
}

export function mapDetail(res: GrpcRecipeDetail) {
  return {
    ...mapSummary(res),
    description: res.description,
    servings: res.servings,
    calories: res.calories || null,
    ingredients: (res.ingredients ?? []).map((item) => ({
      ingredientId: item.ingredient_id,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      optional: item.optional,
    })),
    steps: (res.steps ?? []).map((step) => ({
      order: step.order,
      content: step.content,
      imageUrl: step.image_url || null,
    })),
    tags: res.tags ?? [],
    isFavorited: res.has_favorite ? res.is_favorited : undefined,
    createdAt: res.created_at,
  };
}
