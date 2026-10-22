import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ShoppingList } from './shopping-list.entity';

@Entity('shopping_list_items')
export class ShoppingListItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'shopping_list_id', type: 'uuid' })
  shoppingListId: string;

  @Column({ name: 'ingredient_id', type: 'uuid' })
  ingredientId: string;

  @Column({ length: 150 })
  name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  quantity: string | number;

  @Column({ length: 20 })
  unit: string;

  @Column({ type: 'boolean', default: false })
  checked: boolean;

  @ManyToOne(() => ShoppingList, (list) => list.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shopping_list_id' })
  shoppingList: ShoppingList;
}
