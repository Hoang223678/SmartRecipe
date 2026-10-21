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
