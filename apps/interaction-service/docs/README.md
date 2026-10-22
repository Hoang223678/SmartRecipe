# Interaction Service — Luồng 4 (Favorite, Rating, Comment, Report)

Actor: **User, Chef, Moderator, Admin**. Guest không JWT → **401** (`Missing JWT`), trừ `GET /recipes/:id/comments`.

- HTTP / Swagger: `http://localhost:3005/docs`
- DB: `interaction_db`

Lỗi HTTP dùng chung `ErrorDto`: `{ statusCode, code, message, details? }`

| HTTP | `code` | Khi nào |
|---|---|---|
| 400 | `BadRequestException` | UUID / enum / score 1–5 / content rỗng |
| 401 | `UnauthorizedException` | Thiếu hoặc JWT hết hạn |
| 403 | `ForbiddenException` | Role GUEST, hoặc user đang mute khi comment |
| 404 | `NotFoundException` | Favorite / collection / parent comment không tồn tại (hoặc không thuộc user) |
| 409 | `ConflictException` | Tên collection trùng, recipe đã trong collection, report OPEN trùng |

---

## Interface / DTO

```ts
enum ReportTargetType { RECIPE, COMMENT }
enum ReportReason { SPAM, INAPPROPRIATE, COPYRIGHT, MISLEADING, OTHER }

interface FavoriteStatusDto { recipeId: string; favorited: boolean; favoriteCount: number }
interface CreateCollectionDto { name: string; isPublic?: boolean }
interface CollectionDto { id: string; name: string; isPublic: boolean; recipeIds: string[]; createdAt: string }
interface AddCollectionRecipeDto { recipeId: string }
interface UpsertRatingDto { score: number } // 1..5
interface RatingStatusDto { recipeId: string; score: number; avgRating: number; ratingCount: number }
interface CreateCommentDto { content: string; parentId?: string }
interface CommentDto {
  id: string; recipeId: string; userId: string; authorName: string;
  authorAvatar?: string | null; authorRole: string; parentId?: string | null;
  content: string; createdAt: string;
}
interface CreateReportDto { targetType: ReportTargetType; targetId: string; reason: ReportReason; note?: string }
interface ReportDto { id: string; targetType: ReportTargetType; targetId: string; reason: ReportReason; status: string; createdAt: string }
```

---

## API

Base trực tiếp `:3005`.

### `POST /recipes/:id/favorite`

User+. Idempotent: gọi lại vẫn `favorited: true`. Emit `favorite.changed`.

**200** `FavoriteStatusDto`

| Fail | HTTP | `code` | `message` |
|---|---|---|---|
| Guest | 401 | `UnauthorizedException` | `Missing JWT` |

### `DELETE /recipes/:id/favorite`

User+. Emit `favorite.changed`.

**200** `FavoriteStatusDto` (`favorited: false`)

| Fail | HTTP | `code` | `message` |
|---|---|---|---|
| Chưa favorite | 404 | `NotFoundException` | `Favorite not found` |

### `GET /collections` · `POST /collections`

User+. `POST` body `CreateCollectionDto`. Unique `(user_id, name)`.

**200** `CollectionDto[]` / `CollectionDto`

| Fail | HTTP | `code` | `message` |
|---|---|---|---|
| Trùng tên | 409 | `ConflictException` | `Collection name already exists` |

### `POST /collections/:id/recipes`

User+. Body `{ recipeId }`. Chỉ owner.

**200** `CollectionDto`

| Fail | HTTP | `code` | `message` |
|---|---|---|---|
| Không có / không phải owner | 404 | `NotFoundException` | `Collection not found` |
| Đã có recipe | 409 | `ConflictException` | `Recipe already in collection` |

### `PUT /recipes/:id/rating`

User+. Upsert 1 điểm / user. Ghi đè khi sửa. Emit `rating.changed`.

**200** `RatingStatusDto`

| Fail | HTTP | `code` | `message` |
|---|---|---|---|
| `score` ngoài 1–5 | 400 | `BadRequestException` | validator |

### `GET /recipes/:id/comments`

Mọi role (kể Guest). Chỉ `status = VISIBLE`.

**200** `CommentDto[]`

### `POST /recipes/:id/comments`

User+. `parentId` = trả lời (cùng recipe). Chef cũng comment như User+. Emit `comment.created`.

**201/200** `CommentDto`

| Fail | HTTP | `code` | `message` |
|---|---|---|---|
| Mute còn hạn | 403 | `ForbiddenException` | `User is muted` |
| parent không thuộc recipe | 404 | `NotFoundException` | `Parent comment not found` |

### `POST /reports`

User+. Unique một report `OPEN` / (reporter, target).

**200** `ReportDto`

| Fail | HTTP | `code` | `message` |
|---|---|---|---|
| Đã có OPEN | 409 | `ConflictException` | `Open report already exists` |

---

## Seed

Khi bảng trống:

- favorites / ratings trên `Cơm gà Hội An` và `Phở bò`
- 1 collection `Món cuối tuần` (user.an)
- 10 comments VISIBLE trên Cơm gà (1 reply)
- 1 report OPEN trên comment đầu
