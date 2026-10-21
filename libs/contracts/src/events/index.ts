export const EVENTS = {
  RECIPE_APPROVED: 'recipe.approved',
  RECIPE_UPDATED: 'recipe.updated',
  RATING_CHANGED: 'rating.changed',
  USER_DIET_UPDATED: 'user.diet.updated',
  USER_ROLE_CHANGED: 'user.role.changed',
} as const;

export type DomainEvent = (typeof EVENTS)[keyof typeof EVENTS];

export class RecipeApprovedEvent {
  recipeId: string;
  authorId: string;
}

export class RecipeUpdatedEvent {
  recipeId: string;
}

export class RatingChangedEvent {
  recipeId: string;
  avgRating: number;
  ratingCount: number;
}

export class UserDietUpdatedEvent {
  userId: string;
}

export class UserRoleChangedEvent {
  userId: string;
  role: string;
  actorId: string;
}
