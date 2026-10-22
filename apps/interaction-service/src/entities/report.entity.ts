import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { ReportReason, ReportStatus, ReportTargetType } from '@app/contracts';

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'reporter_id', type: 'uuid' })
  reporterId: string;

  @Column({ name: 'target_type', type: 'text' })
  targetType: ReportTargetType;

  @Column({ name: 'target_id', type: 'uuid' })
  targetId: string;

  @Column({ type: 'text' })
  reason: ReportReason;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @Column({ type: 'text', default: ReportStatus.OPEN })
  status: ReportStatus;

  @Column({ name: 'resolved_by', type: 'uuid', nullable: true })
  resolvedBy: string | null;

  @Column({ name: 'resolution_action', type: 'text', nullable: true })
  resolutionAction: string | null;

  @Column({ name: 'resolution_note', type: 'text', nullable: true })
  resolutionNote: string | null;

  @Column({ name: 'resolved_at', type: 'timestamptz', nullable: true })
  resolvedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
