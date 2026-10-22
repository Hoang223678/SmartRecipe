import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  AddCollectionRecipeDto,
  CreateCollectionDto,
  CreateCommentDto,
  CreateReportDto,
  UpsertRatingDto,
  USER_PLUS_ROLES,
} from '@app/contracts';
import { CurrentUser, Public, Roles } from '@app/auth-lib';
import type { JwtUser } from '@app/auth-lib';
import { InteractionService } from '../interaction.service';

const UserPlus = () => Roles(...USER_PLUS_ROLES);

@ApiTags('interaction')
@ApiBearerAuth()
@Controller()
export class InteractionHttpController {
  constructor(private readonly interaction: InteractionService) {}

  @UserPlus()
  @Post('recipes/:id/favorite')
  @ApiOperation({ summary: 'Lưu công thức vào yêu thích (idempotent)' })
  addFavorite(
    @Param('id', ParseUUIDPipe) recipeId: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.interaction.addFavorite(user.sub, recipeId);
  }

  @UserPlus()
  @Delete('recipes/:id/favorite')
  @ApiOperation({ summary: 'Bỏ lưu yêu thích' })
  removeFavorite(
    @Param('id', ParseUUIDPipe) recipeId: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.interaction.removeFavorite(user.sub, recipeId);
  }

  @UserPlus()
  @Get('collections')
  @ApiOperation({ summary: 'Danh sách bộ sưu tập của tôi' })
  listCollections(@CurrentUser() user: JwtUser) {
    return this.interaction.listCollections(user.sub);
  }

  @UserPlus()
  @Post('collections')
  @ApiOperation({ summary: 'Tạo bộ sưu tập' })
  createCollection(
    @Body() dto: CreateCollectionDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.interaction.createCollection(user.sub, dto);
  }

  @UserPlus()
  @Post('collections/:id/recipes')
  @ApiOperation({ summary: 'Thêm công thức vào bộ sưu tập' })
  addToCollection(
    @Param('id', ParseUUIDPipe) collectionId: string,
    @Body() dto: AddCollectionRecipeDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.interaction.addRecipeToCollection(
      user.sub,
      collectionId,
      dto.recipeId,
    );
  }

  @UserPlus()
  @Put('recipes/:id/rating')
  @ApiOperation({ summary: 'Chấm sao 1–5 (mỗi user một điểm, ghi đè khi sửa)' })
  upsertRating(
    @Param('id', ParseUUIDPipe) recipeId: string,
    @Body() dto: UpsertRatingDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.interaction.upsertRating(user.sub, recipeId, dto);
  }

  @Public()
  @Get('recipes/:id/comments')
  @ApiOperation({ summary: 'Xem bình luận (mọi role, gồm Guest)' })
  listComments(@Param('id', ParseUUIDPipe) recipeId: string) {
    return this.interaction.listComments(recipeId);
  }

  @UserPlus()
  @Post('recipes/:id/comments')
  @ApiOperation({ summary: 'Bình luận hoặc trả lời (parentId)' })
  createComment(
    @Param('id', ParseUUIDPipe) recipeId: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.interaction.createComment(user, recipeId, dto);
  }

  @UserPlus()
  @Post('reports')
  @ApiOperation({ summary: 'Báo cáo công thức hoặc bình luận' })
  createReport(@Body() dto: CreateReportDto, @CurrentUser() user: JwtUser) {
    return this.interaction.createReport(user.sub, dto);
  }
}
