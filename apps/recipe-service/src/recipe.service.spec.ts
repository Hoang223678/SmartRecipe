import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  Difficulty,
  RecipeSortBy,
  RecipeStatus,
} from '@app/contracts';
import { RecipeService } from './recipe.service';
import { Recipe } from './entities/recipe.entity';
import { RecipeIngredient } from './entities/recipe-ingredient.entity';
import { RecipeTag } from './entities/recipe-tag.entity';
import { SEED_RECIPE_ID } from './recipe.seed';

function mockQb(result: {
  many?: Recipe[];
  count?: number;
  raw?: unknown[];
}) {
  const qb: Record<string, jest.Mock> = {};
  const chain = () => qb;
  for (const key of [
    'where',
    'andWhere',
    'orderBy',
    'skip',
    'take',
    'innerJoin',
    'select',
    'addSelect',
    'distinct',
    'limit',
  ]) {
    qb[key] = jest.fn().mockImplementation(chain);
  }
  qb.getManyAndCount = jest
    .fn()
    .mockResolvedValue([result.many ?? [], result.count ?? 0]);
  qb.getRawMany = jest.fn().mockResolvedValue(result.raw ?? []);
  return qb;
}

function approvedRecipe(overrides: Partial<Recipe> = {}): Recipe {
  return {
    id: SEED_RECIPE_ID,
    authorId: 'author-1',
    authorName: 'Chef Lan',
    title: 'Cơm gà Hội An',
    description: 'Món cơm gà',
    servings: 2,
    cookTimeMinutes: 45,
    difficulty: Difficulty.MEDIUM,
    calories: 650,
    thumbnailUrl: 'http://img',
    status: RecipeStatus.APPROVED,
    avgRating: 4.5,
    ratingCount: 12,
    favoriteCount: 8,
    publishedAt: new Date('2026-01-01'),
    deletedAt: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ingredients: [
      {
        recipeId: SEED_RECIPE_ID,
        ingredientId: 'ing-1',
        ingredientName: 'Thịt gà',
        quantity: 400,
        unit: 'g',
        isOptional: false,
      } as RecipeIngredient,
    ],
    steps: [
      {
        stepOrder: 2,
        content: 'Xới cơm',
        imageUrl: null,
      } as Recipe['steps'][0],
      {
        stepOrder: 1,
        content: 'Luộc gà',
        imageUrl: null,
      } as Recipe['steps'][0],
    ],
    tags: [
      { tagId: 'tag-1', tagName: 'Món chính' } as RecipeTag,
    ],
    ...overrides,
  };
}

describe('RecipeService', () => {
  let service: RecipeService;
  let recipes: {
    createQueryBuilder: jest.Mock;
    findOne: jest.Mock;
    count: jest.Mock;
    save: jest.Mock;
    create: jest.Mock;
  };
  let ingredients: { createQueryBuilder: jest.Mock };
  let tags: { createQueryBuilder: jest.Mock };

  beforeEach(async () => {
    recipes = {
      createQueryBuilder: jest.fn(),
      findOne: jest.fn(),
      count: jest.fn(),
      save: jest.fn(),
      create: jest.fn((x) => x),
    };
    ingredients = { createQueryBuilder: jest.fn() };
    tags = { createQueryBuilder: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecipeService,
        { provide: getRepositoryToken(Recipe), useValue: recipes },
        {
          provide: getRepositoryToken(RecipeIngredient),
          useValue: ingredients,
        },
        { provide: getRepositoryToken(RecipeTag), useValue: tags },
      ],
    }).compile();

    service = module.get(RecipeService);
  });

  describe('GET /recipes', () => {
    it('returns paginated APPROVED summaries', async () => {
      const qb = mockQb({ many: [approvedRecipe()], count: 1 });
      recipes.createQueryBuilder.mockReturnValue(qb);

      const result = await service.search({ page: 1, limit: 20 });

      expect(result.total).toBe(1);
      expect(result.items[0]).toMatchObject({
        id: SEED_RECIPE_ID,
        title: 'Cơm gà Hội An',
        cookTimeMinutes: 45,
        author: { displayName: 'Chef Lan' },
      });
      expect(qb.where).toHaveBeenCalledWith(
        'r.status = :status',
        { status: RecipeStatus.APPROVED },
      );
    });

    it('applies q, difficulty, maxCookTime, tagIds and sortBy', async () => {
      const qb = mockQb({ many: [], count: 0 });
      recipes.createQueryBuilder.mockReturnValue(qb);

      await service.search({
        q: 'gà',
        difficulty: Difficulty.EASY,
        maxCookTime: 30,
        tagIds: ['tag-1'],
        sortBy: RecipeSortBy.RATING,
      });

      expect(qb.andWhere).toHaveBeenCalledWith('r.title ILIKE :q', {
        q: '%gà%',
      });
      expect(qb.andWhere).toHaveBeenCalledWith('r.difficulty = :difficulty', {
        difficulty: Difficulty.EASY,
      });
      expect(qb.andWhere).toHaveBeenCalledWith(
        'r.cook_time_minutes <= :maxCookTime',
        { maxCookTime: 30 },
      );
      expect(qb.orderBy).toHaveBeenCalledWith('r.avg_rating', 'DESC');
    });

    it('fails closed: never lists non-approved in query filter', async () => {
      const qb = mockQb({ many: [], count: 0 });
      recipes.createQueryBuilder.mockReturnValue(qb);
      await service.search({});
      expect(qb.andWhere).toHaveBeenCalledWith('r.deleted_at IS NULL');
    });
  });

  describe('GET /recipes/:id', () => {
    it('returns detail with steps sorted and isFavorited when logged in', async () => {
      recipes.findOne.mockResolvedValue(approvedRecipe());

      const detail = await service.getById(SEED_RECIPE_ID, 'user-1');

      expect(detail.steps.map((s) => s.order)).toEqual([1, 2]);
      expect(detail.ingredients[0].name).toBe('Thịt gà');
      expect(detail.isFavorited).toBe(false);
      expect(detail.createdAt).toBe('2026-01-01T00:00:00.000Z');
    });

    it('omits isFavorited for guests', async () => {
      recipes.findOne.mockResolvedValue(approvedRecipe());
      const detail = await service.getById(SEED_RECIPE_ID);
      expect(detail.isFavorited).toBeUndefined();
    });

    it('fails when recipe is missing or not APPROVED', async () => {
      recipes.findOne.mockResolvedValue(null);
      await expect(service.getById(SEED_RECIPE_ID)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('GET /ingredients', () => {
    it('returns distinct ingredient options', async () => {
      const qb = mockQb({
        raw: [{ id: 'ing-1', name: 'Thịt gà' }],
      });
      ingredients.createQueryBuilder.mockReturnValue(qb);

      await expect(service.searchIngredients('gà')).resolves.toEqual([
        { id: 'ing-1', name: 'Thịt gà' },
      ]);
      expect(qb.andWhere).toHaveBeenCalledWith(
        'ri.ingredient_name ILIKE :q',
        { q: '%gà%' },
      );
    });

    it('fails to match when q has no ingredients (empty list)', async () => {
      const qb = mockQb({ raw: [] });
      ingredients.createQueryBuilder.mockReturnValue(qb);
      await expect(service.searchIngredients('xyz')).resolves.toEqual([]);
    });
  });

  describe('GET /tags', () => {
    it('returns distinct tags', async () => {
      const qb = mockQb({
        raw: [{ id: 'tag-1', name: 'Món chính' }],
      });
      tags.createQueryBuilder.mockReturnValue(qb);
      await expect(service.listTags()).resolves.toEqual([
        { id: 'tag-1', name: 'Món chính' },
      ]);
    });
  });
});
