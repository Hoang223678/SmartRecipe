export enum Role {
  GUEST = 'GUEST',
  USER = 'USER',
  CHEF = 'CHEF',
  MODERATOR = 'MODERATOR',
  ADMIN = 'ADMIN',
}

export enum RecipeStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  HIDDEN = 'HIDDEN',
}

export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

export enum RecipeSortBy {
  NEWEST = 'newest',
  RATING = 'rating',
  POPULAR = 'popular',
  COOK_TIME = 'cookTime',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  BANNED = 'BANNED',
}

export enum CommentStatus {
  VISIBLE = 'VISIBLE',
  HIDDEN = 'HIDDEN',
}

export enum ReportTargetType {
  RECIPE = 'RECIPE',
  COMMENT = 'COMMENT',
}

export enum ReportReason {
  SPAM = 'SPAM',
  INAPPROPRIATE = 'INAPPROPRIATE',
  COPYRIGHT = 'COPYRIGHT',
  MISLEADING = 'MISLEADING',
  OTHER = 'OTHER',
}

export enum ReportStatus {
  OPEN = 'OPEN',
  RESOLVED = 'RESOLVED',
  DISMISSED = 'DISMISSED',
}

/** User, Chef, Moderator, Admin — Guest bị 401. */
export const USER_PLUS_ROLES = [
  Role.USER,
  Role.CHEF,
  Role.MODERATOR,
  Role.ADMIN,
] as const;

export enum MealType {
  BREAKFAST = 'BREAKFAST',
  LUNCH = 'LUNCH',
  DINNER = 'DINNER',
  SNACK = 'SNACK',
}
