import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Recipe } from './recipe.entity';

@Entity('recipe_steps')
export class RecipeStep {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'recipe_id', type: 'uuid' })
  recipeId: string;

  @Column({ name: 'step_order', type: 'smallint' })
  stepOrder: number;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'image_url', type: 'text', nullable: true })
  imageUrl: string | null;

  @ManyToOne(() => Recipe, (recipe) => recipe.steps, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recipe_id' })
  recipe: Recipe;
}
