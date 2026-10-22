import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@app/contracts';
import { PlannerHttpController } from '../api/planner.http.controller';
import { PlannerService, SEED_WEEK_START } from '../planner.service';

const jwt = { sub: 'user-1', email: 'a@b.com', role: Role.USER };

describe('PlannerHttpController', () => {
  let controller: PlannerHttpController;
  let planner: Record<string, jest.Mock>;

  beforeEach(async () => {
    planner = {
      upsertWeek: jest.fn(),
      getWeek: jest.fn(),
      generateShoppingList: jest.fn(),
      toggleItem: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlannerHttpController],
      providers: [{ provide: PlannerService, useValue: planner }],
    }).compile();
    controller = module.get(PlannerHttpController);
  });

  it('PUT meal plan delegates', async () => {
    await controller.upsert(SEED_WEEK_START, { entries: [] }, jwt);
    expect(planner.upsertWeek).toHaveBeenCalledWith('user-1', SEED_WEEK_START, {
      entries: [],
    });
  });

  it('GET meal plan delegates', async () => {
    await controller.getWeek(SEED_WEEK_START, jwt);
    expect(planner.getWeek).toHaveBeenCalledWith('user-1', SEED_WEEK_START);
  });

  it('POST generate fails when service throws', async () => {
    planner.generateShoppingList.mockRejectedValue(
      new Error('Meal plan not found'),
    );
    await expect(
      controller.generate({ weekStart: SEED_WEEK_START }, jwt),
    ).rejects.toThrow('Meal plan not found');
  });

  it('PATCH item delegates', async () => {
    await controller.toggle('list-1', 'item-1', { checked: true }, jwt);
    expect(planner.toggleItem).toHaveBeenCalledWith(
      'user-1',
      'list-1',
      'item-1',
      { checked: true },
    );
  });
});
