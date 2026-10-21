import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Recipe } from './recipe.entity';

@Entity('recipe_tags')
export class RecipeTag {
  @PrimaryColumn({ name: 'recipe_id', type: 'uuid' })
  recipeId: string;

  @PrimaryColumn({ name: 'tag_id', type: 'uuid' })
  tagId: string;

  @Column({ name: 'tag_name', length: 80 })
  tagName: string;

  @ManyToOne(() => Recipe, (recipe) => recipe.tags, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recipe_id' })
  recipe: Recipe;
}
