import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EventPublisher } from '@app/messaging';
import { ReportReason, ReportTargetType, Role } from '@app/contracts';
import { InteractionService } from '../interaction.service';
import { Favorite } from '../entities/favorite.entity';
import { Collection } from '../entities/collection.entity';
import { CollectionRecipe } from '../entities/collection-recipe.entity';
import { Rating } from '../entities/rating.entity';
import { Report } from '../entities/report.entity';
import { Comment } from '../entities/comment.entity';
import { UserMute } from '../entities/user-mute.entity';
import { OutboxEvent } from '../entities/outbox-event.entity';
import { SEED_RECIPE_ID } from '../interaction.seed';

type MockRepo = {
  findOne: jest.Mock;
  find: jest.Mock;
  save: jest.Mock;
  create: jest.Mock;
  remove: jest.Mock;
  count: jest.Mock;
  createQueryBuilder: jest.Mock;
};

function mockRepo(): MockRepo {
  return {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(async (x: unknown) => x),
    create: jest.fn((x: unknown) => x),
    remove: jest.fn(),
    count: jest.fn().mockResolvedValue(0),
    createQueryBuilder: jest.fn(),
  };
}

const user = {
  sub: 'user-1',
  email: 'an@smart-recipe.local',
  role: Role.USER,
};

describe('InteractionService', () => {
  let service: InteractionService;
  let favorites: MockRepo;
  let collections: MockRepo;
  let collectionRecipes: MockRepo;
  let ratings: MockRepo;
  let comments: MockRepo;
  let reports: MockRepo;
  let mutes: MockRepo;
  let outbox: MockRepo;
  let events: {
    favoriteChanged: jest.Mock;
    ratingChanged: jest.Mock;
    commentCreated: jest.Mock;
  };

  beforeEach(async () => {
    favorites = mockRepo();
    collections = mockRepo();
    collectionRecipes = mockRepo();
    ratings = mockRepo();
    comments = mockRepo();
    reports = mockRepo();
    mutes = mockRepo();
    outbox = mockRepo();
    events = {
      favoriteChanged: jest.fn(),
      ratingChanged: jest.fn(),
      commentCreated: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InteractionService,
        { provide: getRepositoryToken(Favorite), useValue: favorites },
        { provide: getRepositoryToken(Collection), useValue: collections },
        {
          provide: getRepositoryToken(CollectionRecipe),
          useValue: collectionRecipes,
        },
        { provide: getRepositoryToken(Rating), useValue: ratings },
        { provide: getRepositoryToken(Comment), useValue: comments },
        { provide: getRepositoryToken(Report), useValue: reports },
        { provide: getRepositoryToken(UserMute), useValue: mutes },
        { provide: getRepositoryToken(OutboxEvent), useValue: outbox },
        { provide: EventPublisher, useValue: events },
      ],
    }).compile();

    service = module.get(InteractionService);
  });

  describe('POST /recipes/:id/favorite', () => {
    it('adds favorite and returns count', async () => {
      favorites.findOne.mockResolvedValue(null);
      favorites.count.mockResolvedValue(3);
      const result = await service.addFavorite(user.sub, SEED_RECIPE_ID);
      expect(result).toEqual({
        recipeId: SEED_RECIPE_ID,
        favorited: true,
        favoriteCount: 3,
      });
      expect(events.favoriteChanged).toHaveBeenCalled();
    });

    it('is idempotent when already favorited', async () => {
      favorites.findOne.mockResolvedValue({ userId: user.sub });
      favorites.count.mockResolvedValue(1);
      await service.addFavorite(user.sub, SEED_RECIPE_ID);
      expect(favorites.save).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /recipes/:id/favorite', () => {
    it('removes favorite', async () => {
      favorites.findOne.mockResolvedValue({ userId: user.sub });
      favorites.count.mockResolvedValue(0);
      const result = await service.removeFavorite(user.sub, SEED_RECIPE_ID);
      expect(result.favorited).toBe(false);
    });

    it('fails when not favorited', async () => {
      favorites.findOne.mockResolvedValue(null);
      await expect(
        service.removeFavorite(user.sub, SEED_RECIPE_ID),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('collections', () => {
    it('GET lists collections of the user', async () => {
      collections.find.mockResolvedValue([
        {
          id: 'c1',
          name: 'Weekend',
          isPublic: false,
          recipes: [{ recipeId: SEED_RECIPE_ID }],
          createdAt: new Date('2026-01-01'),
        },
      ]);
      const rows = await service.listCollections(user.sub);
      expect(rows[0].recipeIds).toEqual([SEED_RECIPE_ID]);
    });

    it('POST fails when name exists', async () => {
      collections.findOne.mockResolvedValue({ id: 'c1' });
      await expect(
        service.createCollection(user.sub, { name: 'Weekend' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('POST creates collection', async () => {
      collections.findOne.mockResolvedValue(null);
      collections.save.mockImplementation(async (x: Collection) => ({
        ...x,
        id: 'c-new',
        createdAt: new Date('2026-01-01'),
        recipes: [],
      }));
      const created = await service.createCollection(user.sub, {
        name: 'New',
        isPublic: true,
      });
      expect(created.name).toBe('New');
      expect(created.isPublic).toBe(true);
    });

    it('add recipe fails for other user collection', async () => {
      collections.findOne.mockResolvedValue({
        id: 'c1',
        userId: 'other',
        recipes: [],
      });
      await expect(
        service.addRecipeToCollection(user.sub, 'c1', SEED_RECIPE_ID),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('add recipe fails when already added', async () => {
      collections.findOne.mockResolvedValue({
        id: 'c1',
        userId: user.sub,
        recipes: [{ recipeId: SEED_RECIPE_ID }],
      });
      await expect(
        service.addRecipeToCollection(user.sub, 'c1', SEED_RECIPE_ID),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('PUT /recipes/:id/rating', () => {
    it('upserts score and returns stats', async () => {
      ratings.findOne.mockResolvedValue(null);
      ratings.createQueryBuilder.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ avg: '4.5', count: '2' }),
      });
      const result = await service.upsertRating(user.sub, SEED_RECIPE_ID, {
        score: 5,
      });
      expect(result.avgRating).toBe(4.5);
      expect(result.ratingCount).toBe(2);
      expect(events.ratingChanged).toHaveBeenCalled();
    });
  });

  describe('comments', () => {
    it('GET returns visible comments', async () => {
      comments.find.mockResolvedValue([
        {
          id: 'cm1',
          recipeId: SEED_RECIPE_ID,
          userId: user.sub,
          authorName: 'An',
          authorAvatar: null,
          authorRole: Role.USER,
          parentId: null,
          content: 'Ngon',
          createdAt: new Date('2026-01-01'),
        },
      ]);
      const rows = await service.listComments(SEED_RECIPE_ID);
      expect(rows).toHaveLength(1);
      expect(rows[0].content).toBe('Ngon');
    });

    it('POST fails when muted', async () => {
      mutes.findOne.mockResolvedValue({ id: 'm1' });
      await expect(
        service.createComment(user, SEED_RECIPE_ID, { content: 'hi' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('POST fails when parent missing', async () => {
      mutes.findOne.mockResolvedValue(null);
      comments.findOne.mockResolvedValue(null);
      await expect(
        service.createComment(user, SEED_RECIPE_ID, {
          content: 'reply',
          parentId: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('POST creates comment', async () => {
      mutes.findOne.mockResolvedValue(null);
      comments.save.mockImplementation(async (x: Comment) => ({
        ...x,
        id: 'cm-new',
        createdAt: new Date('2026-01-01'),
      }));
      const created = await service.createComment(user, SEED_RECIPE_ID, {
        content: 'Hay',
      });
      expect(created.content).toBe('Hay');
      expect(events.commentCreated).toHaveBeenCalled();
    });
  });

  describe('POST /reports', () => {
    it('creates report', async () => {
      reports.findOne.mockResolvedValue(null);
      reports.save.mockImplementation(async (x: Report) => ({
        ...x,
        id: 'r1',
        createdAt: new Date('2026-01-01'),
      }));
      const created = await service.createReport(user.sub, {
        targetType: ReportTargetType.RECIPE,
        targetId: SEED_RECIPE_ID,
        reason: ReportReason.SPAM,
      });
      expect(created.status).toBe('OPEN');
    });

    it('fails when open report exists', async () => {
      reports.findOne.mockResolvedValue({ id: 'r1' });
      await expect(
        service.createReport(user.sub, {
          targetType: ReportTargetType.COMMENT,
          targetId: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1',
          reason: ReportReason.SPAM,
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });
});
