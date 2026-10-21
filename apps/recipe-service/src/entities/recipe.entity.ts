import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Difficulty, RecipeStatus } from '@app/contracts';
import { RecipeIngredient } from './recipe-ingredient.entity';
import { RecipeStep } from './recipe-step.entity';
import { RecipeTag } from './recipe-tag.entity';

@Entity('recipes')
export class Recipe {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'author_id', type: 'uuid' })
  authorId: string;

  @Column({ name: 'author_name', length: 100 })
  authorName: string;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text', default: '' })
  description: string;

  @Column({ type: 'smallint', default: 1 })
  servings: number;

  @Column({ name: 'cook_time_minutes', type: 'int', default: 0 })
  cookTimeMinutes: number;

  @Column({ type: 'text', default: Difficulty.EASY })
  difficulty: Difficulty;

  @Column({ type: 'int', nullable: true })
  calories: number | null;

  @Column({ name: 'thumbnail_url', type: 'text', nullable: true })
  thumbnailUrl: string | null;

  @Column({ type: 'text', default: RecipeStatus.DRAFT })
  status: RecipeStatus;

  @Column({ name: 'avg_rating', type: 'decimal', precision: 3, scale: 2, default: 0 })
  avgRating: string | number;

  @Column({ name: 'rating_count', type: 'int', default: 0 })
  ratingCount: number;

  @Column({ name: 'favorite_count', type: 'int', default: 0 })
  favoriteCount: number;

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt: Date | null;

  @Column({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => RecipeIngredient, (row) => row.recipe, { cascade: true })
  ingredients: RecipeIngredient[];

  @OneToMany(() => RecipeStep, (row) => row.recipe, { cascade: true })
  steps: RecipeStep[];

  @OneToMany(() => RecipeTag, (row) => row.recipe, { cascade: true })
  tags: RecipeTag[];
}
