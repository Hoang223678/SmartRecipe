import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  SearchIngredientsQueryDto,
  SearchRecipesQueryDto,
} from '@app/contracts';
import { CurrentUser, Public } from '@app/auth-lib';
import type { JwtUser } from '@app/auth-lib';
import { RecipeService } from '../recipe.service';

@ApiTags('recipes')
@Controller()
export class RecipeHttpController {
  constructor(private readonly recipes: RecipeService) {}

  @Public()
  @Get('recipes')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Danh sách, tìm kiếm, lọc, sắp xếp (chỉ APPROVED)',
  })
  search(@Query() query: SearchRecipesQueryDto) {
    return this.recipes.search(query);
  }

  @Public()
  @Get('recipes/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Chi tiết công thức APPROVED' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user?: JwtUser,
  ) {
    return this.recipes.getById(id, user?.sub);
  }

  @Public()
  @Get('ingredients')
  @ApiOperation({ summary: 'Autocomplete nguyên liệu khi nhập' })
  ingredients(@Query() query: SearchIngredientsQueryDto) {
    return this.recipes.searchIngredients(query.q);
  }

  @Public()
  @Get('tags')
  @ApiOperation({ summary: 'Danh sách tag / loại món trên công thức đã duyệt' })
  tags() {
    return this.recipes.listTags();
  }
}
