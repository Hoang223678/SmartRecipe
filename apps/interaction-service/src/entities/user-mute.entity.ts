import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('user_mutes')
export class UserMute {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'muted_by', type: 'uuid' })
  mutedBy: string;

  @Column({ type: 'text' })
  reason: string;

  @Column({ name: 'muted_until', type: 'timestamptz' })
  mutedUntil: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
