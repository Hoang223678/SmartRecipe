import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import {
  CollectionDto,
  CommentDto,
  CommentStatus,
  CreateCollectionDto,
  CreateCommentDto,
  CreateReportDto,
  EVENTS,
  FavoriteStatusDto,
  RatingStatusDto,
  ReportDto,
  ReportStatus,
  UpsertRatingDto,
} from '@app/contracts';
import { EventPublisher } from '@app/messaging';
import type { JwtUser } from '@app/auth-lib';
import { Favorite } from './entities/favorite.entity';
import { Collection } from './entities/collection.entity';
import { CollectionRecipe } from './entities/collection-recipe.entity';
import { Rating } from './entities/rating.entity';
import { Comment } from './entities/comment.entity';
import { Report } from './entities/report.entity';
import { UserMute } from './entities/user-mute.entity';
import { OutboxEvent } from './entities/outbox-event.entity';
import {
  seedCollections,
  seedComments,
  seedFavorites,
  seedRatings,
  seedReports,
} from './interaction.seed';
import type { IInteractionService } from './interface/interaction.service.interface';

@Injectable()
export class InteractionService implements OnModuleInit, IInteractionService {
  constructor(
    @InjectRepository(Favorite) private readonly favorites: Repository<Favorite>,
    @InjectRepository(Collection)
    private readonly collections: Repository<Collection>,
    @InjectRepository(CollectionRecipe)
    private readonly collectionRecipes: Repository<CollectionRecipe>,
    @InjectRepository(Rating) private readonly ratings: Repository<Rating>,
    @InjectRepository(Comment) private readonly comments: Repository<Comment>,
    @InjectRepository(Report) private readonly reports: Repository<Report>,
    @InjectRepository(UserMute) private readonly mutes: Repository<UserMute>,
    @InjectRepository(OutboxEvent)
    private readonly outbox: Repository<OutboxEvent>,
    private readonly events: EventPublisher,
  ) {}

  async onModuleInit(): Promise<void> {
    if ((await this.favorites.count()) === 0) {
      await this.favorites.save(this.favorites.create(seedFavorites()));
    }
    if ((await this.ratings.count()) === 0) {
      await this.ratings.save(this.ratings.create(seedRatings()));
    }
    if ((await this.collections.count()) === 0) {
      await this.collections.save(this.collections.create(seedCollections()));
    }
    if ((await this.comments.count()) === 0) {
      await this.comments.save(this.comments.create(seedComments()));
    }
    if ((await this.reports.count()) === 0) {
      await this.reports.save(this.reports.create(seedReports()));
    }
  }

  async addFavorite(userId: string, recipeId: string): Promise<FavoriteStatusDto> {
    const exists = await this.favorites.findOne({ where: { userId, recipeId } });
    if (!exists) {
      await this.favorites.save(this.favorites.create({ userId, recipeId }));
    }
    const favoriteCount = await this.favorites.count({ where: { recipeId } });
    await this.publish(
      'recipe',
      recipeId,
      EVENTS.FAVORITE_CHANGED,
      { recipeId, favoriteCount, favorited: true },
    );
    this.events.favoriteChanged({ recipeId, favoriteCount, favorited: true });
    return { recipeId, favorited: true, favoriteCount };
  }

  async removeFavorite(userId: string, recipeId: string): Promise<FavoriteStatusDto> {
    const exists = await this.favorites.findOne({ where: { userId, recipeId } });
    if (!exists) {
      throw new NotFoundException('Favorite not found');
    }
    await this.favorites.remove(exists);
    const favoriteCount = await this.favorites.count({ where: { recipeId } });
    await this.publish(
      'recipe',
      recipeId,
      EVENTS.FAVORITE_CHANGED,
      { recipeId, favoriteCount, favorited: false },
    );
    this.events.favoriteChanged({ recipeId, favoriteCount, favorited: false });
    return { recipeId, favorited: false, favoriteCount };
  }

  async listCollections(userId: string): Promise<CollectionDto[]> {
    const rows = await this.collections.find({
      where: { userId },
      relations: ['recipes'],
      order: { createdAt: 'DESC' },
    });
    return rows.map((row) => this.toCollection(row));
  }

  async createCollection(
    userId: string,
    dto: CreateCollectionDto,
  ): Promise<CollectionDto> {
    const dup = await this.collections.findOne({
      where: { userId, name: dto.name },
    });
    if (dup) {
      throw new ConflictException('Collection name already exists');
    }
    const saved = await this.collections.save(
      this.collections.create({
        userId,
        name: dto.name,
        isPublic: dto.isPublic ?? false,
        recipes: [],
      }),
    );
    return this.toCollection(saved);
  }

  async addRecipeToCollection(
    userId: string,
    collectionId: string,
    recipeId: string,
  ): Promise<CollectionDto> {
    const collection = await this.collections.findOne({
      where: { id: collectionId },
      relations: ['recipes'],
    });
    if (!collection || collection.userId !== userId) {
      throw new NotFoundException('Collection not found');
    }
    const already = collection.recipes?.some((r) => r.recipeId === recipeId);
    if (already) {
      throw new ConflictException('Recipe already in collection');
    }
    await this.collectionRecipes.save(
      this.collectionRecipes.create({ collectionId, recipeId }),
    );
    const reloaded = await this.collections.findOne({
      where: { id: collectionId },
      relations: ['recipes'],
    });
    return this.toCollection(reloaded!);
  }

  async upsertRating(
    userId: string,
    recipeId: string,
    dto: UpsertRatingDto,
  ): Promise<RatingStatusDto> {
    const existing = await this.ratings.findOne({ where: { userId, recipeId } });
    if (existing) {
      existing.score = dto.score;
      await this.ratings.save(existing);
    } else {
      await this.ratings.save(
        this.ratings.create({ userId, recipeId, score: dto.score }),
      );
    }
    const stats = await this.ratingStats(recipeId);
    await this.publish('recipe', recipeId, EVENTS.RATING_CHANGED, {
      recipeId,
      ...stats,
    });
    this.events.ratingChanged({ recipeId, ...stats });
    return { recipeId, score: dto.score, ...stats };
  }

  async listComments(recipeId: string): Promise<CommentDto[]> {
    const rows = await this.comments.find({
      where: { recipeId, status: CommentStatus.VISIBLE },
      order: { createdAt: 'ASC' },
    });
    return rows.map((row) => this.toComment(row));
  }

  async createComment(
    user: JwtUser,
    recipeId: string,
    dto: CreateCommentDto,
  ): Promise<CommentDto> {
    const muted = await this.mutes.findOne({
      where: { userId: user.sub, mutedUntil: MoreThan(new Date()) },
    });
    if (muted) {
      throw new ForbiddenException('User is muted');
    }
    if (dto.parentId) {
      const parent = await this.comments.findOne({
        where: { id: dto.parentId, recipeId },
      });
      if (!parent) {
        throw new NotFoundException('Parent comment not found');
      }
    }
    const saved = await this.comments.save(
      this.comments.create({
        recipeId,
        userId: user.sub,
        authorName: user.email,
        authorRole: user.role,
        parentId: dto.parentId ?? null,
        content: dto.content,
        status: CommentStatus.VISIBLE,
      }),
    );
    await this.publish('recipe', recipeId, EVENTS.COMMENT_CREATED, {
      recipeId,
      commentId: saved.id,
    });
    this.events.commentCreated({ recipeId, commentId: saved.id });
    return this.toComment(saved);
  }

  async createReport(reporterId: string, dto: CreateReportDto): Promise<ReportDto> {
    const open = await this.reports.findOne({
      where: {
        reporterId,
        targetType: dto.targetType,
        targetId: dto.targetId,
        status: ReportStatus.OPEN,
      },
    });
    if (open) {
      throw new ConflictException('Open report already exists');
    }
    const saved = await this.reports.save(
      this.reports.create({
        reporterId,
        targetType: dto.targetType,
        targetId: dto.targetId,
        reason: dto.reason,
        note: dto.note ?? null,
        status: ReportStatus.OPEN,
      }),
    );
    return {
      id: saved.id,
      targetType: saved.targetType,
      targetId: saved.targetId,
      reason: saved.reason,
      status: saved.status,
      createdAt: saved.createdAt.toISOString(),
    };
  }

  private async ratingStats(recipeId: string): Promise<{
    avgRating: number;
    ratingCount: number;
  }> {
    const raw = await this.ratings
      .createQueryBuilder('r')
      .select('AVG(r.score)', 'avg')
      .addSelect('COUNT(*)', 'count')
      .where('r.recipe_id = :recipeId', { recipeId })
      .getRawOne<{ avg: string | null; count: string }>();
    return {
      avgRating: raw?.avg ? Number(Number(raw.avg).toFixed(2)) : 0,
      ratingCount: Number(raw?.count ?? 0),
    };
  }

  private async publish(
    aggregateType: string,
    aggregateId: string,
    eventType: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    await this.outbox.save(
      this.outbox.create({ aggregateType, aggregateId, eventType, payload }),
    );
  }

  private toCollection(row: Collection): CollectionDto {
    return {
      id: row.id,
      name: row.name,
      isPublic: row.isPublic,
      recipeIds: (row.recipes ?? []).map((r) => r.recipeId),
      createdAt: row.createdAt.toISOString(),
    };
  }

  private toComment(row: Comment): CommentDto {
    return {
      id: row.id,
      recipeId: row.recipeId,
      userId: row.userId,
      authorName: row.authorName,
      authorAvatar: row.authorAvatar,
      authorRole: row.authorRole,
      parentId: row.parentId,
      content: row.content,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
