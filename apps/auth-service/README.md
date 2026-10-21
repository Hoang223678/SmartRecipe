# Auth Service

Quản lý đăng ký, đăng nhập, refresh/logout token, hồ sơ user và cập nhật role.

- HTTP (Swagger): `http://localhost:3001/docs`
- Qua API Gateway: `http://localhost:3000/api/v1` — Swagger `http://localhost:3000/docs`
- gRPC: `auth-service:50051` (`libs/contracts/proto/auth.proto`)

Mọi response lỗi HTTP dùng chung `ErrorDto`.

## ErrorDto (mọi lỗi)

```ts
{
  statusCode: number;
  code: string;      // tên exception, vd ConflictException
  message: string;
  details?: unknown; // payload gốc của Nest (nếu có)
}
```

Ví dụ:

```json
{
  "statusCode": 409,
  "code": "ConflictException",
  "message": "Email already registered",
  "details": {
    "message": "Email already registered",
    "error": "Conflict",
    "statusCode": 409
  }
}
```

### Bảng mã lỗi chung

| HTTP | `code` | Khi nào | gRPC |
|---|---|---|---|
| 400 | `BadRequestException` | Body không hợp lệ (class-validator) | `INVALID_ARGUMENT` (3) |
| 401 | `UnauthorizedException` | Sai credentials / thiếu hoặc JWT hết hạn / refresh token không hợp lệ | `UNAUTHENTICATED` (16) |
| 403 | `ForbiddenException` | Bị cấm, không đủ role, gán `GUEST` | `PERMISSION_DENIED` (7) |
| 404 | `NotFoundException` | Không tìm thấy user | `NOT_FOUND` (5) |
| 409 | `ConflictException` | Email đã tồn tại | `ALREADY_EXISTS` (6) |
| 500 | `INTERNAL_ERROR` | Lỗi không bắt | `UNKNOWN` (2) |

JWT guard (HTTP, trước khi vào service):

| HTTP | `message` |
|---|---|
| 401 | `Missing JWT` — không có `Authorization: Bearer` |
| 401 | `Invalid or expired JWT` |
| 403 | `Insufficient role` — không phải ADMIN khi `PUT /users/:id` |

---

## Response DTO

### UserProfileDto

```ts
{
  id: string;                 // uuid
  email: string;
  displayName: string;
  avatarUrl: string | null;
  role: 'USER' | 'CHEF' | 'MODERATOR' | 'ADMIN';
  status: 'ACTIVE' | 'BANNED';
}
```

`GUEST` không lưu DB (chưa đăng nhập).

### AuthTokensDto

```ts
{
  accessToken: string;        // JWT, 15 phút; payload { sub, email, role }
  refreshToken: string;       // random hex, 7 ngày, chỉ lưu hash SHA-256
  user: UserProfileDto;
}
```

### LogoutResponseDto

```ts
{ ok: true }
```

### HealthDto

```ts
{ status: 'ok'; service: 'auth-service' }
```

---

## Request DTO & validation

### RegisterRequestDto — `POST /auth/register`

| Field | Rule |
|---|---|
| `email` | email hợp lệ |
| `password` | string, min 8 |
| `displayName` | string, min 2 |

### LoginRequestDto — `POST /auth/login`

| Field | Rule |
|---|---|
| `email` | email hợp lệ |
| `password` | string, min 8 |

### RefreshRequestDto / LogoutRequestDto

| Field | Rule |
|---|---|
| `refreshToken` | string, bắt buộc |

### UpdateUserRoleDto — `PUT /users/:id`

| Field | Rule |
|---|---|
| `role` | enum `GUEST \| USER \| CHEF \| MODERATOR \| ADMIN` |

Gán `GUEST` bị từ chối ở service (403).

---

## API

Base HTTP trực tiếp: `http://localhost:3001`  
Base qua gateway: `http://localhost:3000/api/v1`

### `GET /health`

Public. Không auth.

**200** `HealthDto`

---

### `POST /auth/register`

Public. Tạo user `role=USER`, `status=ACTIVE`, trả cặp token.

**201/200** `AuthTokensDto`

| Fail | HTTP | `code` | `message` |
|---|---|---|---|
| Email/password/displayName invalid | 400 | `BadRequestException` | validator message |
| Email đã đăng ký | 409 | `ConflictException` | `Email already registered` |

gRPC: `Register({ email, password, display_name })` → `{ access_token, refresh_token, user }`

---

### `POST /auth/login`

Public.

**200** `AuthTokensDto`

| Fail | HTTP | `code` | `message` |
|---|---|---|---|
| Body invalid | 400 | `BadRequestException` | validator message |
| Sai email/password hoặc không có password (Google-only) | 401 | `UnauthorizedException` | `Invalid credentials` |
| `status = BANNED` | 403 | `ForbiddenException` | `Account is banned` |

gRPC: `Login({ email, password, user_agent, ip_address })`

---

### `POST /auth/refresh`

Public. Rotate refresh token (token cũ bị revoke).

**200** `AuthTokensDto`

| Fail | HTTP | `code` | `message` |
|---|---|---|---|
| Thiếu `refreshToken` | 400 | `BadRequestException` | validator message |
| Không tồn tại / đã revoke / hết hạn | 401 | `UnauthorizedException` | `Invalid refresh token` |

gRPC: `Refresh({ refresh_token })`

---

### `POST /auth/logout`

Cần JWT. Thu hồi refresh token nếu còn hiệu lực. Idempotent: token lạ vẫn `ok: true`.

**200** `{ "ok": true }`

| Fail | HTTP | `code` | `message` |
|---|---|---|---|
| Thiếu/hết hạn JWT | 401 | `UnauthorizedException` | `Missing JWT` / `Invalid or expired JWT` |
| Body invalid | 400 | `BadRequestException` | validator message |

gRPC: `Logout({ refresh_token })` → `{}`

---

### `GET /auth/me`

Cần JWT. `sub` trong access token dùng làm `userId`.

**200** `UserProfileDto`

| Fail | HTTP | `code` | `message` |
|---|---|---|---|
| Thiếu/hết hạn JWT | 401 | `UnauthorizedException` | `Missing JWT` / `Invalid or expired JWT` |
| User đã bị xóa | 404 | `NotFoundException` | `User not found` |

gRPC: `GetMe({ user_id })` → user proto

---

### `PUT /users/:id`

Cần JWT **ADMIN**. Cập nhật role, ghi `audit_logs`, outbox `user.role.changed`, publish RabbitMQ.

**200** `UserProfileDto`

Body:

```json
{ "role": "CHEF" }
```

| Fail | HTTP | `code` | `message` |
|---|---|---|---|
| Thiếu/hết hạn JWT | 401 | `UnauthorizedException` | `Missing JWT` / `Invalid or expired JWT` |
| Không phải ADMIN | 403 | `ForbiddenException` | `Insufficient role` |
| `role` không thuộc enum | 400 | `BadRequestException` | validator message |
| `role = GUEST` | 403 | `ForbiddenException` | `Cannot assign GUEST role` |
| Không có user | 404 | `NotFoundException` | `User not found` |

gRPC: `UpdateUserRole({ user_id, role, actor_id })`

---

## Admin seed

Khi service start, nếu chưa có user:

- email: `admin@smart-recipe.local`
- password: `Admin@123`
- role: `ADMIN`

Đổi bằng env `ADMIN_EMAIL`, `ADMIN_PASSWORD`.
