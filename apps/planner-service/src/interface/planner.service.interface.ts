import {
  GenerateShoppingListRequestDto,
  MealPlanDto,
  ShoppingListDto,
  ToggleShoppingItemRequestDto,
  UpsertMealPlanRequestDto,
} from '@app/contracts';

export interface IPlannerService {
  upsertWeek(
    userId: string,
    weekStart: string,
    dto: UpsertMealPlanRequestDto,
  ): Promise<MealPlanDto>;
  getWeek(userId: string, weekStart: string): Promise<MealPlanDto>;
  generateShoppingList(
    userId: string,
    dto: GenerateShoppingListRequestDto,
  ): Promise<ShoppingListDto>;
  toggleItem(
    userId: string,
    listId: string,
    itemId: string,
    dto: ToggleShoppingItemRequestDto,
  ): Promise<ShoppingListDto>;
}
