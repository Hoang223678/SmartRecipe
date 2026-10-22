import {
  CollectionDto,
  CommentDto,
  CreateCollectionDto,
  CreateCommentDto,
  CreateReportDto,
  FavoriteStatusDto,
  RatingStatusDto,
  ReportDto,
  UpsertRatingDto,
} from '@app/contracts';
import type { JwtUser } from '@app/auth-lib';

export interface IInteractionService {
  addFavorite(userId: string, recipeId: string): Promise<FavoriteStatusDto>;
  removeFavorite(userId: string, recipeId: string): Promise<FavoriteStatusDto>;
  listCollections(userId: string): Promise<CollectionDto[]>;
  createCollection(
    userId: string,
    dto: CreateCollectionDto,
  ): Promise<CollectionDto>;
  addRecipeToCollection(
    userId: string,
    collectionId: string,
    recipeId: string,
  ): Promise<CollectionDto>;
  upsertRating(
    userId: string,
    recipeId: string,
    dto: UpsertRatingDto,
  ): Promise<RatingStatusDto>;
  listComments(recipeId: string): Promise<CommentDto[]>;
  createComment(
    user: JwtUser,
    recipeId: string,
    dto: CreateCommentDto,
  ): Promise<CommentDto>;
  createReport(reporterId: string, dto: CreateReportDto): Promise<ReportDto>;
}
