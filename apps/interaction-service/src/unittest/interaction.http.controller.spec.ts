import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@app/contracts';
import { InteractionHttpController } from '../api/interaction.http.controller';
import { InteractionService } from '../interaction.service';
import { SEED_RECIPE_ID } from '../interaction.seed';

const jwt = { sub: 'user-1', email: 'a@b.com', role: Role.USER };

describe('InteractionHttpController', () => {
  let controller: InteractionHttpController;
  let interaction: Record<string, jest.Mock>;

  beforeEach(async () => {
    interaction = {
      addFavorite: jest.fn(),
      removeFavorite: jest.fn(),
      listCollections: jest.fn(),
      createCollection: jest.fn(),
      addRecipeToCollection: jest.fn(),
      upsertRating: jest.fn(),
      listComments: jest.fn(),
      createComment: jest.fn(),
      createReport: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InteractionHttpController],
      providers: [{ provide: InteractionService, useValue: interaction }],
    }).compile();
    controller = module.get(InteractionHttpController);
  });

  it('POST favorite delegates', async () => {
    await controller.addFavorite(SEED_RECIPE_ID, jwt);
    expect(interaction.addFavorite).toHaveBeenCalledWith('user-1', SEED_RECIPE_ID);
  });

  it('DELETE favorite fails when service throws', async () => {
    interaction.removeFavorite.mockRejectedValue(new Error('Favorite not found'));
    await expect(
      controller.removeFavorite(SEED_RECIPE_ID, jwt),
    ).rejects.toThrow('Favorite not found');
  });

  it('GET comments is public delegate', async () => {
    interaction.listComments.mockResolvedValue([]);
    await controller.listComments(SEED_RECIPE_ID);
    expect(interaction.listComments).toHaveBeenCalledWith(SEED_RECIPE_ID);
  });

  it('PUT rating delegates score', async () => {
    await controller.upsertRating(SEED_RECIPE_ID, { score: 4 }, jwt);
    expect(interaction.upsertRating).toHaveBeenCalledWith('user-1', SEED_RECIPE_ID, {
      score: 4,
    });
  });
});
