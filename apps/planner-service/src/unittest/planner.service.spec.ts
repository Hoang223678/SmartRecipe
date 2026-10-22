import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Difficulty, MealType } from '@app/contracts';
import { PlannerService, SEED_RECIPE_ID, SEED_WEEK_START } from '../planner.service';
import { MealPlan } from '../entities/meal-plan.entity';
import { MealPlanEntry } from '../entities/meal-plan-entry.entity';
import { ShoppingList } from '../entities/shopping-list.entity';
import { ShoppingListItem } from '../entities/shopping-list-item.entity';
import { RECIPE_CATALOG } from '../interface/recipe-catalog.interface';

type MockRepo = {
  findOne: jest.Mock;
  save: jest.Mock;
  create: jest.Mock;
  remove: jest.Mock;
  count: jest.Mock;
};

function mockRepo(): MockRepo {
  return {
    findOne: jest.fn(),
    save: jest.fn(async (x: unknown) => x),
    create: jest.fn((x: unknown) => x),
    remove: jest.fn(),
    count: jest.fn().mockResolvedValue(0),
  };
}

const catalogRecipe = {
  id: SEED_RECIPE_ID,
  title: 'Cơm gà Hội An',
  thumbnailUrl: 'http://img',
  cookTimeMinutes: 45,
  difficulty: Difficulty.MEDIUM,
  avgRating: 4.5,
  ratingCount: 12,
  author: { id: 'chef', displayName: 'Chef Lan' },
  servings: 2,
  ingredients: [
    { ingredientId: 'ing-ga', name: 'Thịt gà', quantity: 400, unit: 'g' },
    { ingredientId: 'ing-gao', name: 'Gạo', quantity: 300, unit: 'g' },
  ],
};

describe('PlannerService', () => {
  let service: PlannerService;
  let plans: MockRepo;
  let entries: MockRepo;
  let lists: MockRepo;
  let items: MockRepo;
  let catalog: { getApproved: jest.Mock };

  beforeEach(async () => {
    plans = mockRepo();
    entries = mockRepo();
    lists = mockRepo();
    items = mockRepo();
    catalog = { getApproved: jest.fn().mockResolvedValue(catalogRecipe) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlannerService,
        { provide: getRepositoryToken(MealPlan), useValue: plans },
        { provide: getRepositoryToken(MealPlanEntry), useValue: entries },
        { provide: getRepositoryToken(ShoppingList), useValue: lists },
        { provide: getRepositoryToken(ShoppingListItem), useValue: items },
        { provide: RECIPE_CATALOG, useValue: catalog },
      ],
    }).compile();
    service = module.get(PlannerService);
  });

  describe('PUT /meal-plans/:weekStart', () => {
    it('upserts weekly plan', async () => {
      plans.findOne.mockResolvedValue(null);
      plans.save.mockImplementation(async (x: MealPlan) => ({
        ...x,
        id: 'plan-1',
      }));
      const result = await service.upsertWeek('user-1', SEED_WEEK_START, {
        entries: [
          {
            date: SEED_WEEK_START,
            mealType: MealType.LUNCH,
            recipeId: SEED_RECIPE_ID,
            servings: 2,
          },
        ],
      });
      expect(result.weekStart).toBe(SEED_WEEK_START);
      expect(result.entries[0].recipe.title).toBe('Cơm gà Hội An');
    });

    it('fails when weekStart is not Monday', async () => {
      await expect(
        service.upsertWeek('user-1', '2026-01-06', { entries: [] }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('GET /meal-plans/:weekStart', () => {
    it('returns empty entries when missing', async () => {
      plans.findOne.mockResolvedValue(null);
      const result = await service.getWeek('user-1', SEED_WEEK_START);
      expect(result.entries).toEqual([]);
    });
  });

  describe('POST /shopping-lists/generate', () => {
    it('aggregates ingredients scaled by servings', async () => {
      plans.findOne.mockResolvedValue({
        id: 'plan-1',
        weekStart: SEED_WEEK_START,
        entries: [
          {
            recipeId: SEED_RECIPE_ID,
            servings: 4,
          },
        ],
      });
      lists.save.mockImplementation(async (x: ShoppingList) => ({
        ...x,
        id: 'list-1',
        items: x.items?.map((item, i) => ({ ...item, id: `item-${i}` })),
      }));
      const result = await service.generateShoppingList('user-1', {
        weekStart: SEED_WEEK_START,
      });
      const ga = result.items.find((i) => i.ingredientId === 'ing-ga');
      expect(ga?.quantity).toBe(800);
    });

    it('fails when meal plan missing', async () => {
      plans.findOne.mockResolvedValue(null);
      await expect(
        service.generateShoppingList('user-1', { weekStart: SEED_WEEK_START }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('PATCH /shopping-lists/:id/items/:itemId', () => {
    it('toggles checked', async () => {
      lists.findOne.mockResolvedValue({
        id: 'list-1',
        userId: 'user-1',
        mealPlanId: 'plan-1',
        items: [{ id: 'item-1', ingredientId: 'ing-ga', name: 'Gà', quantity: 1, unit: 'g', checked: false }],
      });
      plans.findOne.mockResolvedValue({ weekStart: SEED_WEEK_START });
      const result = await service.toggleItem('user-1', 'list-1', 'item-1', {
        checked: true,
      });
      expect(result.items[0].checked).toBe(true);
    });

    it('fails when item missing', async () => {
      lists.findOne.mockResolvedValue({
        id: 'list-1',
        userId: 'user-1',
        items: [],
      });
      await expect(
        service.toggleItem('user-1', 'list-1', 'item-x', { checked: true }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
