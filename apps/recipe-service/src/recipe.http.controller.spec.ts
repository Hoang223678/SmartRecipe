import { Test, TestingModule } from '@nestjs/testing';
import { Difficulty } from '@app/contracts';
import { RecipeHttpController } from './recipe.http.controller';
import { RecipeService } from './recipe.service';
import { SEED_RECIPE_ID } from './recipe.seed';

describe('RecipeHttpController', () => {
  let controller: RecipeHttpController;
  let recipes: {
    search: jest.Mock;
    getById: jest.Mock;
    searchIngredients: jest.Mock;
    listTags: jest.Mock;
  };

  beforeEach(async () => {
    recipes = {
      search: jest.fn(),
      getById: jest.fn(),
      searchIngredients: jest.fn(),
      listTags: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecipeHttpController],
      providers: [{ provide: RecipeService, useValue: recipes }],
    }).compile();
    controller = module.get(RecipeHttpController);
  });

  it('GET /recipes delegates query', async () => {
    recipes.search.mockResolvedValue({ items: [], page: 1, limit: 20, total: 0 });
    await controller.search({ q: 'gà', difficulty: Difficulty.EASY });
    expect(recipes.search).toHaveBeenCalledWith({
      q: 'gà',
      difficulty: Difficulty.EASY,
    });
  });

  it('GET /recipes/:id passes viewer id', async () => {
    recipes.getById.mockResolvedValue({ id: SEED_RECIPE_ID });
    await controller.findOne(SEED_RECIPE_ID, {
      sub: 'u1',
      email: 'a@b.com',
      role: 'USER' as never,
    });
    expect(recipes.getById).toHaveBeenCalledWith(SEED_RECIPE_ID, 'u1');
  });

  it('GET /recipes/:id fails when service throws NotFound', async () => {
    recipes.getById.mockRejectedValue(new Error('Recipe not found'));
    await expect(controller.findOne(SEED_RECIPE_ID)).rejects.toThrow(
      'Recipe not found',
    );
  });

  it('GET /ingredients and /tags delegate', async () => {
    recipes.searchIngredients.mockResolvedValue([]);
    recipes.listTags.mockResolvedValue([]);
    await controller.ingredients({ q: 'ga' });
    await controller.tags();
    expect(recipes.searchIngredients).toHaveBeenCalledWith('ga');
    expect(recipes.listTags).toHaveBeenCalled();
  });
});
