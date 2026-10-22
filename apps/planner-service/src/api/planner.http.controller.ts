import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  GenerateShoppingListRequestDto,
  ToggleShoppingItemRequestDto,
  UpsertMealPlanRequestDto,
  USER_PLUS_ROLES,
} from '@app/contracts';
import { CurrentUser, Roles } from '@app/auth-lib';
import type { JwtUser } from '@app/auth-lib';
import { PlannerService } from '../planner.service';

const UserPlus = () => Roles(...USER_PLUS_ROLES);

@ApiTags('planner')
@ApiBearerAuth()
@Controller()
export class PlannerHttpController {
  constructor(private readonly planner: PlannerService) {}

  @UserPlus()
  @Put('meal-plans/:weekStart')
  @ApiOperation({ summary: 'Tạo / cập nhật kế hoạch tuần (weekStart = thứ Hai)' })
  upsert(
    @Param('weekStart') weekStart: string,
    @Body() dto: UpsertMealPlanRequestDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.planner.upsertWeek(user.sub, weekStart, dto);
  }

  @UserPlus()
  @Get('meal-plans/:weekStart')
  @ApiOperation({ summary: 'Xem kế hoạch tuần' })
  getWeek(
    @Param('weekStart') weekStart: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.planner.getWeek(user.sub, weekStart);
  }

  @UserPlus()
  @Post('shopping-lists/generate')
  @ApiOperation({ summary: 'Gộp nguyên liệu từ meal plan, trừ nguyên liệu đã có' })
  generate(
    @Body() dto: GenerateShoppingListRequestDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.planner.generateShoppingList(user.sub, dto);
  }

  @UserPlus()
  @Patch('shopping-lists/:id/items/:itemId')
  @ApiOperation({ summary: 'Đánh dấu đã mua / chưa mua' })
  toggle(
    @Param('id') listId: string,
    @Param('itemId') itemId: string,
    @Body() dto: ToggleShoppingItemRequestDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.planner.toggleItem(user.sub, listId, itemId, dto);
  }
}
