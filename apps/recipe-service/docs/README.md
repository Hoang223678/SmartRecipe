# Recipe Service — Luồng Browse & Search

Chỉ trả công thức **APPROVED** và chưa xóa mềm. Guest xem được (không bắt JWT). Nếu có Bearer hợp lệ, `GET /recipes/:id` thêm `isFavorited` (hiện luôn `false` cho đến khi có interaction-service).

- HTTP / Swagger: `http://localhost:3003/docs`
- Qua gateway: `http://localhost:3000/api/v1` — Swagger `http://localhost:3000/docs`
- gRPC: `recipe-service:50053` (`libs/contracts/proto/recipe.proto`)

Lỗi HTTP dùng chung `ErrorDto`:

```ts
{ statusCode: number; code: string; message: string; details?: unknown }
```

| HTTP | `code` | Khi nào |
|---|---|---|
| 400 | `BadRequestException` | Query/param không hợp lệ (`id` không phải UUID, `difficulty`/`sortBy` sai enum) |
| 404 | `NotFoundException` | Không có công thức APPROVED tương ứng |
| 500 | `INTERNAL_ERROR` | Lỗi không bắt |

---

## Interface / DTO

```ts
enum Difficulty { EASY = 'EASY', MEDIUM = 'MEDIUM', HARD = 'HARD' }
enum RecipeSortBy { NEWEST = 'newest', RATING = 'rating', POPULAR = 'popular', COOK_TIME = 'cookTime' }

interface PageQueryDto { page?: number; limit?: number } // page≥1, 1≤limit≤100, mặc định 1 / 20

interface SearchRecipesQueryDto extends PageQueryDto {
  q?: string;
  tagIds?: string[];          // query: tagIds=uuid hoặc tagIds=a,b
  maxCookTime?: number;       // phút
  difficulty?: Difficulty;
  sortBy?: RecipeSortBy;
}

interface RecipeSummaryDto {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  cookTimeMinutes: number;
  difficulty: Difficulty;
  avgRating: number;
  ratingCount: number;
  author: { id: string; displayName: string };
}

interface RecipeDetailDto extends RecipeSummaryDto {
  description: string;
  servings: number;
  calories: number | null;
  ingredients: { ingredientId: string; name: string; quantity: number; unit: string; optional?: boolean }[];
  steps: { order: number; content: string; imageUrl?: string | null }[];
  tags: { id: string; name: string }[];
  isFavorited?: boolean;      // chỉ khi đã đăng nhập
  createdAt: string;          // ISO-8601
}

interface RecipePageDto {
  items: RecipeSummaryDto[];
  page: number;
  limit: number;
  total: number;
}

interface IngredientOptionDto { id: string; name: string }
```

---

## API

Base trực tiếp `:3003` — qua gateway thêm prefix `/api/v1`.

### `GET /recipes`

Mọi role (kể cả Guest). Lọc `status = APPROVED AND deleted_at IS NULL`.

**200** `RecipePageDto`

| Query | Ý nghĩa |
|---|---|
| `q` | `title ILIKE %q%` |
| `tagIds` | Có **ít nhất một** tag |
| `maxCookTime` | `cook_time_minutes <= n` |
| `difficulty` | `EASY \| MEDIUM \| HARD` |
| `sortBy` | `newest` (published_at DESC, mặc định), `rating`, `popular` (favorite_count), `cookTime` ASC |
| `page`, `limit` | Phân trang |

**Fail**

| Case | HTTP | `message` |
|---|---|---|
| `difficulty=HOT` / `sortBy=foo` / `page=0` | 400 | validator |

---

### `GET /recipes/:id`

**200** `RecipeDetailDto`

**Fail**

| Case | HTTP | `code` | `message` |
|---|---|---|---|
| `id` không phải UUID | 400 | `BadRequestException` | Validation failed (uuid is expected) |
| Không tồn tại / DRAFT / HIDDEN / đã xóa | 404 | `NotFoundException` | `Recipe not found` |

---

### `GET /ingredients?q=`

Autocomplete nguyên liệu xuất hiện trên công thức APPROVED (snapshot `recipe_ingredients`).

**200** `IngredientOptionDto[]` — tối đa 20, sort theo tên.

`q` optional: `ingredient_name ILIKE %q%`.

---

### `GET /tags`

**200** `{ id: string; name: string }[]` — tag distinct trên công thức APPROVED.

---

### `GET /health`

**200** `{ status: 'ok', service: 'recipe-service' }`

---

## Seed

Khi start, insert các recipe APPROVED còn thiếu (10 món). id cố định của món đầu:

- id: `11111111-1111-4111-8111-111111111111`
- title: `Cơm gà Hội An`

Các món khác: Phở bò, Bún chả, Bánh mì thịt, Canh chua cá, Gỏi cuốn, Cơm tấm sườn, Mì Quảng, Chè đậu xanh, Bò kho.

Ingredient / tag snapshot dùng để test `GET /ingredients?q=` và `GET /tags`.
