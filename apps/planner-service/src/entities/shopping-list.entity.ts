import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { ShoppingListItem } from './shopping-list-item.entity';

@Entity('shopping_lists')
export class ShoppingList {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'meal_plan_id', type: 'uuid', nullable: true })
  mealPlanId: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  title: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @OneToMany('ShoppingListItem', 'shoppingList', { cascade: true })
  items: ShoppingListItem[];
}
