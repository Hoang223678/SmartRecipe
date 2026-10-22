import { CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Collection } from './collection.entity';

@Entity('collection_recipes')
export class CollectionRecipe {
  @PrimaryColumn({ name: 'collection_id', type: 'uuid' })
  collectionId: string;

  @PrimaryColumn({ name: 'recipe_id', type: 'uuid' })
  recipeId: string;

  @CreateDateColumn({ name: 'added_at', type: 'timestamptz' })
  addedAt: Date;

  @ManyToOne(() => Collection, (collection) => collection.recipes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'collection_id' })
  collection: Collection;
}
