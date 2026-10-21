import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { Difficulty, RecipeSortBy, Role } from '../enums';

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

export class AuthTokensDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;

  @ApiProperty({ type: UserProfileDto })
  user: UserProfileDto;
}
