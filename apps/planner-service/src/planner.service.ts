import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  GenerateShoppingListRequestDto,
  MealPlanDto,
  MealType,
  ShoppingListDto,
  ToggleShoppingItemRequestDto,
  UpsertMealPlanRequestDto,
} from '@app/contracts';
import { MealPlan } from './entities/meal-plan.entity';
import { MealPlanEntry } from './entities/meal-plan-entry.entity';
import { ShoppingList } from './entities/shopping-list.entity';
import { ShoppingListItem } from './entities/shopping-list-item.entity';
import type { IPlannerService } from './interface/planner.service.interface';
import {
  emptyRecipeSummary,
  RECIPE_CATALOG,
  type IRecipeCatalog,
} from './interface/recipe-catalog.interface';

export const SEED_WEEK_START = '2026-01-05';
export const SEED_USER_AN = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5';
export const SEED_RECIPE_ID = '11111111-1111-4111-8111-111111111111';

@Injectable()
export class PlannerService implements OnModuleInit, IPlannerService {
  constructor(
    @InjectRepository(MealPlan) private readonly plans: Repository<MealPlan>,
    @InjectRepository(MealPlanEntry)
    private readonly entries: Repository<MealPlanEntry>,
    @InjectRepository(ShoppingList)
    private readonly lists: Repository<ShoppingList>,
    @InjectRepository(ShoppingListItem)
    private readonly items: Repository<ShoppingListItem>,
    @Inject(RECIPE_CATALOG) private readonly recipes: IRecipeCatalog,
  ) {}

  async onModuleInit(): Promise<void> {
    if ((await this.plans.count()) > 0) {
      return;
    }
    await this.plans.save(
      this.plans.create({
        userId: SEED_USER_AN,
        weekStart: SEED_WEEK_START,
        entries: [
          {
            planDate: SEED_WEEK_START,
            mealType: MealType.LUNCH,
            recipeId: SEED_RECIPE_ID,
            recipeTitle: 'Cơm gà Hội An',
            thumbnailUrl: 'https://cdn.example.com/com-ga.jpg',
            servings: 2,
          },
        ],
      }),
    );
  }

  async upsertWeek(
    userId: string,
    weekStart: string,
    dto: UpsertMealPlanRequestDto,
  ): Promise<MealPlanDto> {
    const monday = assertMonday(weekStart);
    const seen = new Set<string>();
    for (const entry of dto.entries) {
      assertInWeek(monday, entry.date);
      const key = `${entry.date}:${entry.mealType}`;
      if (seen.has(key)) {
        throw new BadRequestException('Duplicate mealType on the same date');
      }
      seen.add(key);
    }

    const snapshots = await Promise.all(
      dto.entries.map(async (entry) => {
        const recipe = await this.recipes.getApproved(entry.recipeId);
        return { entry, recipe };
      }),
    );

    let plan = await this.plans.findOne({
      where: { userId, weekStart: monday },
      relations: ['entries'],
    });
    if (!plan) {
      plan = this.plans.create({ userId, weekStart: monday, entries: [] });
      plan = await this.plans.save(plan);
    } else if (plan.entries?.length) {
      await this.entries.remove(plan.entries);
    }

    plan.entries = snapshots.map(({ entry, recipe }) =>
      this.entries.create({
        mealPlanId: plan!.id,
        planDate: entry.date,
        mealType: entry.mealType,
        recipeId: recipe.id,
        recipeTitle: recipe.title,
        thumbnailUrl: recipe.thumbnailUrl ?? null,
        servings: entry.servings,
      }),
    );
    await this.plans.save(plan);
    return this.toMealPlan(plan, snapshots.map((s) => s.recipe));
  }

  async getWeek(userId: string, weekStart: string): Promise<MealPlanDto> {
    const monday = assertMonday(weekStart);
    const plan = await this.plans.findOne({
      where: { userId, weekStart: monday },
      relations: ['entries'],
    });
    if (!plan) {
      return { weekStart: monday, entries: [] };
    }
    const recipes = await Promise.all(
      (plan.entries ?? []).map((entry) =>
        this.recipes.getApproved(entry.recipeId).catch(() =>
          emptyRecipeSummary(entry.recipeId, entry.recipeTitle, entry.thumbnailUrl),
        ),
      ),
    );
    return this.toMealPlan(plan, recipes);
  }

  async generateShoppingList(
    userId: string,
    dto: GenerateShoppingListRequestDto,
  ): Promise<ShoppingListDto> {
    const monday = assertMonday(dto.weekStart);
    const plan = await this.plans.findOne({
      where: { userId, weekStart: monday },
      relations: ['entries'],
    });
    if (!plan) {
      throw new NotFoundException('Meal plan not found');
    }
    const exclude = new Set(dto.excludeIngredientIds ?? []);
    const aggregated = new Map<
      string,
      { ingredientId: string; name: string; quantity: number; unit: string }
    >();

    for (const entry of plan.entries ?? []) {
      const recipe = await this.recipes.getApproved(entry.recipeId);
      const factor = entry.servings / Math.max(recipe.servings, 1);
      for (const ing of recipe.ingredients) {
        if (exclude.has(ing.ingredientId)) {
          continue;
        }
        const key = `${ing.ingredientId}:${ing.unit}`;
        const current = aggregated.get(key);
        const qty = ing.quantity * factor;
        if (current) {
          current.quantity += qty;
        } else {
          aggregated.set(key, {
            ingredientId: ing.ingredientId,
            name: ing.name,
            quantity: qty,
            unit: ing.unit,
          });
        }
      }
    }

    const list = await this.lists.save(
      this.lists.create({
        userId,
        mealPlanId: plan.id,
        title: `Shopping ${monday}`,
        items: [...aggregated.values()].map((item) =>
          this.items.create({
            ingredientId: item.ingredientId,
            name: item.name,
            quantity: Number(item.quantity.toFixed(2)),
            unit: item.unit,
            checked: false,
          }),
        ),
      }),
    );
    return this.toShoppingList(list, monday);
  }

  async toggleItem(
    userId: string,
    listId: string,
    itemId: string,
    dto: ToggleShoppingItemRequestDto,
  ): Promise<ShoppingListDto> {
    const list = await this.lists.findOne({
      where: { id: listId, userId },
      relations: ['items'],
    });
    if (!list) {
      throw new NotFoundException('Shopping list not found');
    }
    const item = list.items?.find((row) => row.id === itemId);
    if (!item) {
      throw new NotFoundException('Shopping item not found');
    }
    item.checked = dto.checked;
    await this.items.save(item);
    const plan = list.mealPlanId
      ? await this.plans.findOne({ where: { id: list.mealPlanId } })
      : null;
    return this.toShoppingList(list, toDateString(plan?.weekStart ?? ''));
  }

  private toMealPlan(
    plan: MealPlan,
    recipes: { id: string }[],
  ): MealPlanDto {
    const byId = new Map(recipes.map((r) => [r.id, r]));
    return {
      weekStart: toDateString(plan.weekStart),
      entries: (plan.entries ?? []).map((entry) => {
        const recipe =
          byId.get(entry.recipeId) ??
          emptyRecipeSummary(entry.recipeId, entry.recipeTitle, entry.thumbnailUrl);
        return {
          date: toDateString(entry.planDate),
          mealType: entry.mealType,
          recipe: recipe as MealPlanDto['entries'][0]['recipe'],
          servings: entry.servings,
        };
      }),
    };
  }

  private toShoppingList(list: ShoppingList, weekStart: string): ShoppingListDto {
    return {
      id: list.id,
      weekStart,
      items: (list.items ?? []).map((item) => ({
        id: item.id,
        ingredientId: item.ingredientId,
        name: item.name,
        quantity: Number(item.quantity),
        unit: item.unit,
        checked: item.checked,
      })),
    };
  }
}

export function assertMonday(weekStart: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) {
    throw new BadRequestException('weekStart must be YYYY-MM-DD');
  }
  const day = new Date(`${weekStart}T00:00:00.000Z`).getUTCDay();
  if (day !== 1) {
    throw new BadRequestException('weekStart must be a Monday');
  }
  return weekStart;
}

function assertInWeek(weekStart: string, date: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new BadRequestException('date must be YYYY-MM-DD');
  }
  const start = Date.parse(`${weekStart}T00:00:00.000Z`);
  const end = start + 6 * 24 * 60 * 60 * 1000;
  const value = Date.parse(`${date}T00:00:00.000Z`);
  if (Number.isNaN(value) || value < start || value > end) {
    throw new BadRequestException('date must be within the week');
  }
}

function toDateString(value: string | Date): string {
  if (!value) {
    return '';
  }
  if (typeof value === 'string') {
    return value.slice(0, 10);
  }
  return value.toISOString().slice(0, 10);
}
