import { HealthController } from '../api/health.controller';

describe('HealthController', () => {
  it('returns ok', () => {
    const controller = new HealthController();
    expect(controller.health()).toEqual({
      status: 'ok',
      service: 'auth-service',
    });
  });
});
