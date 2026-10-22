import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  SearchIngredientsQueryDto,
  SearchRecipesQueryDto,
} from '@app/contracts';
import { CurrentUser, Public } from '@app/auth-lib';
import type { JwtUser } from '@app/auth-lib';
import { mapDetail, mapPage, RecipeGrpcClient } from './recipe.grpc-client';

@ApiTags('recipes')
@Controller()
export class RecipeController {
  constructor(private readonly recipes: RecipeGrpcClient) {}

  @Public()
  @Get('recipes')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Danh sách / tìm kiếm công thức APPROVED' })
  async search(@Query() query: SearchRecipesQueryDto) {
    return mapPage(
      await this.recipes.searchRecipes({
        page: query.page ?? 1,
        limit: query.limit ?? 20,
        q: query.q ?? '',
        tag_ids: query.tagIds ?? [],
        max_cook_time: query.maxCookTime ?? 0,
        difficulty: query.difficulty ?? '',
        sort_by: query.sortBy ?? '',
      }),
    );
  }

  @Public()
  @Get('recipes/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Chi tiết công thức APPROVED' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user?: JwtUser,
  ) {
    return mapDetail(
      await this.recipes.getRecipe({ id, user_id: user?.sub ?? '' }),
    );
  }

  @Public()
  @Get('ingredients')
  @ApiOperation({ summary: 'Autocomplete nguyên liệu' })
  async ingredients(@Query() query: SearchIngredientsQueryDto) {
    const res = await this.recipes.searchIngredients({ q: query.q ?? '' });
    return res.items ?? [];
  }

  @Public()
  @Get('tags')
  @ApiOperation({ summary: 'Danh sách tag / loại món' })
  async tags() {
    const res = await this.recipes.listTags();
    return res.items ?? [];
  }
}
