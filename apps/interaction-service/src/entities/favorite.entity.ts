import { CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity('favorites')
export class Favorite {
  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId: string;

  @PrimaryColumn({ name: 'recipe_id', type: 'uuid' })
  recipeId: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
