import { NotFoundException } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import { RecipeGrpcController } from './recipe.grpc.controller';
import { RecipeService } from './recipe.service';
import { SEED_RECIPE_ID } from './recipe.seed';

describe('RecipeGrpcController', () => {
  let controller: RecipeGrpcController;
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
      controllers: [RecipeGrpcController],
      providers: [{ provide: RecipeService, useValue: recipes }],
    }).compile();
    controller = module.get(RecipeGrpcController);
  });

  it('SearchRecipes maps page', async () => {
    recipes.search.mockResolvedValue({
      items: [
        {
          id: SEED_RECIPE_ID,
          title: 'Cơm gà',
          thumbnailUrl: null,
          cookTimeMinutes: 45,
          difficulty: 'MEDIUM',
          avgRating: 4,
          ratingCount: 1,
          author: { id: 'a', displayName: 'Lan' },
        },
      ],
      page: 1,
      limit: 20,
      total: 1,
    });
    const res = await controller.searchRecipes({ q: 'gà' });
    expect(res.total).toBe(1);
    expect(res.items[0].thumbnail_url).toBe('');
    expect(res.items[0].author.display_name).toBe('Lan');
  });

  it('GetRecipe fails with RpcException when missing', async () => {
    recipes.getById.mockRejectedValue(new NotFoundException('Recipe not found'));
    await expect(
      controller.getRecipe({ id: SEED_RECIPE_ID }),
    ).rejects.toBeInstanceOf(RpcException);
  });

  it('SearchIngredients / ListTags wrap items', async () => {
    recipes.searchIngredients.mockResolvedValue([{ id: '1', name: 'Gà' }]);
    recipes.listTags.mockResolvedValue([{ id: 't', name: 'Món chính' }]);
    await expect(
      controller.searchIngredients({ q: 'g' }),
    ).resolves.toEqual({ items: [{ id: '1', name: 'Gà' }] });
    await expect(controller.listTags()).resolves.toEqual({
      items: [{ id: 't', name: 'Món chính' }],
    });
  });
});
