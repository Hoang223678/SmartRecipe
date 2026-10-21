import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { EVENTS } from '@app/contracts';

@Controller()
export class EventsController {
  private readonly logger = new Logger(EventsController.name);

  @EventPattern(EVENTS.RECIPE_APPROVED)
  onRecipeApproved(@Payload() payload: unknown) {
    this.logger.log(`consumed ${EVENTS.RECIPE_APPROVED} ${JSON.stringify(payload)}`);
  }

  @EventPattern(EVENTS.RECIPE_UPDATED)
  onRecipeUpdated(@Payload() payload: unknown) {
    this.logger.log(`consumed ${EVENTS.RECIPE_UPDATED} ${JSON.stringify(payload)}`);
  }

  @EventPattern(EVENTS.RATING_CHANGED)
  onRatingChanged(@Payload() payload: unknown) {
    this.logger.log(`consumed ${EVENTS.RATING_CHANGED} ${JSON.stringify(payload)}`);
  }

  @EventPattern(EVENTS.USER_DIET_UPDATED)
  onUserDietUpdated(@Payload() payload: unknown) {
    this.logger.log(`consumed ${EVENTS.USER_DIET_UPDATED} ${JSON.stringify(payload)}`);
  }
}
