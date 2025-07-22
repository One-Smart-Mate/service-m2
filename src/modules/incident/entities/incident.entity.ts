
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';

@Entity('incident')
export class IncidentEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: ['browser', 'android', 'ios'] })
  platform: string;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'user_name' })
  userName: string;

  @Column('text')
  description: string;

  @Column({ type: 'enum', enum: ['A', 'R'], default: 'A' })
  status: string;

  @Column({ name: 'resolved_at', type: 'timestamp', nullable: true })
  resolvedAt: Date;

  @CreateDateColumn()
  createdAt: Date | null;

  @UpdateDateColumn()
  updatedAt: Date | null;

  @DeleteDateColumn()
  deletedAt: Date | null;
}
