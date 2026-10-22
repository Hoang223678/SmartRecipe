import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import {
  Difficulty,
  MealType,
  RecipeSortBy,
  ReportReason,
  ReportTargetType,
  Role,
} from '../enums';

export class PageQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class PageDto<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
}

export class ErrorDto {
  @ApiProperty()
  statusCode: number;

  @ApiProperty()
  code: string;

  @ApiProperty()
  message: string;

  @ApiPropertyOptional()
  details?: unknown;
}

export class RegisterRequestDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'Nguyen Van A' })
  @IsString()
  @MinLength(2)
  displayName: string;
}

export class LoginRequestDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  password: string;
}

export class RefreshRequestDto {
  @ApiProperty()
  @IsString()
  refreshToken: string;
}

export class LogoutRequestDto {
  @ApiProperty()
  @IsString()
  refreshToken: string;
}

export class UpdateUserRoleDto {
  @ApiProperty({ enum: Role, example: Role.CHEF })
  @IsEnum(Role)
  role: Role;
}

export class UserProfileDto {
  @ApiProperty()
  @IsUUID()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  displayName: string;

  @ApiPropertyOptional()
  avatarUrl?: string | null;

  @ApiProperty({ enum: Role })
  role: Role;

  @ApiProperty()
  status: string;
}

export class AuthorDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  displayName: string;
}

export class RecipeIngredientDto {
  @ApiProperty()
  ingredientId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  unit: string;

  @ApiPropertyOptional()
  optional?: boolean;
}

export class RecipeStepDto {
  @ApiProperty()
  order: number;

  @ApiProperty()
  content: string;

  @ApiPropertyOptional()
  imageUrl?: string | null;
}

export class RecipeTagDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;
}

export class RecipeSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  thumbnailUrl?: string | null;

  @ApiProperty()
  cookTimeMinutes: number;

  @ApiProperty({ enum: Difficulty })
  difficulty: Difficulty;

  @ApiProperty()
  avgRating: number;

  @ApiProperty()
  ratingCount: number;

  @ApiProperty({ type: AuthorDto })
  author: AuthorDto;
}

export class RecipeDetailDto extends RecipeSummaryDto {
  @ApiProperty()
  description: string;

  @ApiProperty()
  servings: number;

  @ApiPropertyOptional()
  calories?: number | null;

  @ApiProperty({ type: [RecipeIngredientDto] })
  ingredients: RecipeIngredientDto[];

  @ApiProperty({ type: [RecipeStepDto] })
  steps: RecipeStepDto[];

  @ApiProperty({ type: [RecipeTagDto] })
  tags: RecipeTagDto[];

  @ApiPropertyOptional({
    description: 'Chỉ có khi đã đăng nhập',
  })
  isFavorited?: boolean;

  @ApiProperty()
  createdAt: string;
}

export class SearchRecipesQueryDto extends PageQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (Array.isArray(value)) {
      return value;
    }
    if (typeof value === 'string' && value.length > 0) {
      return value.split(',').map((v) => v.trim()).filter(Boolean);
    }
    return undefined;
  })
  tagIds?: string[];

  @ApiPropertyOptional({ description: 'phút' })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  maxCookTime?: number;

  @ApiPropertyOptional({ enum: Difficulty })
  @IsOptional()
  @IsEnum(Difficulty)
  difficulty?: Difficulty;

  @ApiPropertyOptional({ enum: RecipeSortBy })
  @IsOptional()
  @IsEnum(RecipeSortBy)
  sortBy?: RecipeSortBy;
}

export class RecipePageDto {
  @ApiProperty({ type: [RecipeSummaryDto] })
  items: RecipeSummaryDto[];

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  total: number;
}

export class IngredientOptionDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;
}

export class SearchIngredientsQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  q?: string;
}

export class FavoriteStatusDto {
  @ApiProperty()
  recipeId: string;

  @ApiProperty()
  favorited: boolean;

  @ApiProperty()
  favoriteCount: number;
}

export class CreateCollectionDto {
  @ApiProperty({ example: 'Món cuối tuần' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

export class CollectionDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  isPublic: boolean;

  @ApiProperty({ type: [String] })
  recipeIds: string[];

  @ApiProperty()
  createdAt: string;
}

export class AddCollectionRecipeDto {
  @ApiProperty()
  @IsUUID()
  recipeId: string;
}

export class UpsertRatingDto {
  @ApiProperty({ minimum: 1, maximum: 5, example: 5 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  score: number;
}

export class RatingStatusDto {
  @ApiProperty()
  recipeId: string;

  @ApiProperty()
  score: number;

  @ApiProperty()
  avgRating: number;

  @ApiProperty()
  ratingCount: number;
}

export class CreateCommentDto {
  @ApiProperty({ maxLength: 2000 })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content: string;

  @ApiPropertyOptional({ description: 'UUID comment cha khi trả lời' })
  @IsOptional()
  @IsUUID()
  parentId?: string;
}

export class CommentDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  recipeId: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  authorName: string;

  @ApiPropertyOptional()
  authorAvatar?: string | null;

  @ApiProperty()
  authorRole: string;

  @ApiPropertyOptional()
  parentId?: string | null;

  @ApiProperty()
  content: string;

  @ApiProperty()
  createdAt: string;
}

export class CreateReportDto {
  @ApiProperty({ enum: ReportTargetType })
  @IsEnum(ReportTargetType)
  targetType: ReportTargetType;

  @ApiProperty()
  @IsUUID()
  targetId: string;

  @ApiProperty({ enum: ReportReason })
  @IsEnum(ReportReason)
  reason: ReportReason;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}

export class ReportDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: ReportTargetType })
  targetType: ReportTargetType;

  @ApiProperty()
  targetId: string;

  @ApiProperty({ enum: ReportReason })
  reason: ReportReason;

  @ApiProperty()
  status: string;

  @ApiProperty()
  createdAt: string;
}

export class MealPlanEntryRequestDto {
  @ApiProperty({ example: '2026-01-05' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date: string;

  @ApiProperty({ enum: MealType })
  @IsEnum(MealType)
  mealType: MealType;

  @ApiProperty()
  @IsUUID()
  recipeId: string;

  @ApiProperty({ default: 2, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  servings: number;
}

export class UpsertMealPlanRequestDto {
  @ApiProperty({ type: [MealPlanEntryRequestDto] })
  @IsArray()
  @ArrayMinSize(0)
  @ValidateNested({ each: true })
  @Type(() => MealPlanEntryRequestDto)
  entries: MealPlanEntryRequestDto[];
}

export class MealPlanEntryDto {
  @ApiProperty()
  date: string;

  @ApiProperty({ enum: MealType })
  mealType: MealType;

  @ApiProperty({ type: RecipeSummaryDto })
  recipe: RecipeSummaryDto;

  @ApiProperty()
  servings: number;
}

export class MealPlanDto {
  @ApiProperty({ example: '2026-01-05' })
  weekStart: string;

  @ApiProperty({ type: [MealPlanEntryDto] })
  entries: MealPlanEntryDto[];
}

export class GenerateShoppingListRequestDto {
  @ApiProperty({ example: '2026-01-05' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  weekStart: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  excludeIngredientIds?: string[];
}

export class ShoppingListItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  ingredientId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  unit: string;

  @ApiProperty()
  checked: boolean;
}

export class ShoppingListDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  weekStart: string;

  @ApiProperty({ type: [ShoppingListItemDto] })
  items: ShoppingListItemDto[];
}

export class ToggleShoppingItemRequestDto {
  @ApiProperty()
  @IsBoolean()
  checked: boolean;
}

export class AuthTokensDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;

  @ApiProperty({ type: UserProfileDto })
  user: UserProfileDto;
}
