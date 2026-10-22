import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CommentStatus, Role } from '@app/contracts';

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'recipe_id', type: 'uuid' })
  recipeId: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'author_name', length: 100 })
  authorName: string;

  @Column({ name: 'author_avatar', type: 'text', nullable: true })
  authorAvatar: string | null;

  @Column({ name: 'author_role', type: 'text', default: Role.USER })
  authorRole: Role;

  @Column({ name: 'parent_id', type: 'uuid', nullable: true })
  parentId: string | null;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'text', default: CommentStatus.VISIBLE })
  status: CommentStatus;

  @Column({ name: 'hidden_by', type: 'uuid', nullable: true })
  hiddenBy: string | null;

  @Column({ name: 'hidden_reason', type: 'text', nullable: true })
  hiddenReason: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
