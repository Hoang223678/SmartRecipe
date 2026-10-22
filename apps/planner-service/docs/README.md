# Planner Service — Luồng 5 (Meal plan & shopping list)

Actor: **User, Chef** (Moderator/Admin dùng được). Guest không JWT → **401**.

- HTTP / Swagger: `http://localhost:3006/docs`
- DB: `planner_db`
- Recipe snapshot qua gRPC `recipe-service` (`GetRecipe`)

Lỗi HTTP dùng `ErrorDto`: `{ statusCode, code, message, details? }`

| HTTP | `code` | Khi nào |
|---|---|---|
| 400 | `BadRequestException` | `weekStart` không phải thứ Hai / `YYYY-MM-DD`, date ngoài tuần, trùng `date+mealType` |
| 401 | `UnauthorizedException` | Thiếu JWT |
| 403 | `ForbiddenException` | Không thuộc User+ |
| 404 | `NotFoundException` | Recipe / meal plan / shopping list / item không tồn tại |

---

## Interface

Xem `src/interface/planner.service.interface.ts`.

```ts
enum MealType { BREAKFAST, LUNCH, DINNER, SNACK }

interface UpsertMealPlanRequestDto {
  entries: { date: string; mealType: MealType; recipeId: string; servings: number }[];
}
interface MealPlanDto {
  weekStart: string;
  entries: { date: string; mealType: string; recipe: RecipeSummaryDto; servings: number }[];
}
interface GenerateShoppingListRequestDto {
  weekStart: string;
  excludeIngredientIds?: string[];
}
interface ShoppingListDto {
  id: string;
  weekStart: string;
  items: { id: string; ingredientId: string; name: string; quantity: number; unit: string; checked: boolean }[];
}
interface ToggleShoppingItemRequestDto { checked: boolean }
```

---

## API

Base `:3006`. `weekStart` = ngày **thứ Hai** (`YYYY-MM-DD`).

### `PUT /meal-plans/:weekStart`

Thay toàn bộ entry của tuần. Gọi recipe-service để snapshot title/thumbnail.

**200** `MealPlanDto`

| Fail | HTTP | `message` |
|---|---|---|
| Không phải Monday | 400 | `weekStart must be a Monday` |
| Recipe không APPROVED | 404 | `Recipe not found` |
| Trùng bữa trong ngày | 400 | `Duplicate mealType on the same date` |

### `GET /meal-plans/:weekStart`

**200** `MealPlanDto` — chưa có plan thì `entries: []`.

### `POST /shopping-lists/generate`

Gộp nguyên liệu theo `ingredientId+unit`, nhân `entry.servings / recipe.servings`. `excludeIngredientIds` = nguyên liệu đã có.

**200** `ShoppingListDto`

| Fail | HTTP | `message` |
|---|---|---|
| Chưa có meal plan | 404 | `Meal plan not found` |

### `PATCH /shopping-lists/:id/items/:itemId`

**200** `ShoppingListDto`

| Fail | HTTP | `message` |
|---|---|---|
| List/item không thuộc user | 404 | `Shopping list not found` / `Shopping item not found` |

---

## Seed

User `aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5`, tuần `2026-01-05`, 1 entry Cơm gà Hội An.
