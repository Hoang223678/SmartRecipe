import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { MealType } from '@app/contracts';
import { MealPlan } from './meal-plan.entity';

@Entity('meal_plan_entries')
export class MealPlanEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'meal_plan_id', type: 'uuid' })
  mealPlanId: string;

  @Column({ name: 'plan_date', type: 'date' })
  planDate: string;

  @Column({ name: 'meal_type', type: 'text' })
  mealType: MealType;

  @Column({ name: 'recipe_id', type: 'uuid' })
  recipeId: string;

  @Column({ name: 'recipe_title', length: 200 })
  recipeTitle: string;

  @Column({ name: 'thumbnail_url', type: 'text', nullable: true })
  thumbnailUrl: string | null;

  @Column({ type: 'smallint', default: 1 })
  servings: number;

  @ManyToOne(() => MealPlan, (plan) => plan.entries, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'meal_plan_id' })
  mealPlan: MealPlan;
}
