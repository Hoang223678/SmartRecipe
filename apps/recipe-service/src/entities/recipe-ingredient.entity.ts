import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Recipe } from './recipe.entity';

@Entity('recipe_ingredients')
export class RecipeIngredient {
  @PrimaryColumn({ name: 'recipe_id', type: 'uuid' })
  recipeId: string;

  @PrimaryColumn({ name: 'ingredient_id', type: 'uuid' })
  ingredientId: string;

  @Column({ name: 'ingredient_name', length: 150 })
  ingredientName: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  quantity: string | number;

  @Column({ length: 20 })
  unit: string;

  @Column({ name: 'is_optional', type: 'boolean', default: false })
  isOptional: boolean;

  @ManyToOne(() => Recipe, (recipe) => recipe.ingredients, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recipe_id' })
  recipe: Recipe;
}
