import { Exclude } from 'class-transformer';
import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, CreateDateColumn, DeleteDateColumn } from 'typeorm';

@Entity('priorities')
export class PriorityEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Exclude()
  @Column({name: 'site_id', type: 'bigint', unsigned: true })
  siteId: number;

  @Column({name: 'priority_code', type: 'char', length: 4 })
  priorityCode: string;

  @Exclude()
  @Column({name: 'site_code', type: 'char', length: 6 })
  siteCode: string;

  @Column({name: 'priority_description', type: 'varchar', length: 50 })
  priorityDescription: string;

  @Column({name: 'priority_days', type: 'int', unsigned: true })
  priorityDays: number;

  @Column({ type: 'char', length: 1, default: 'A' })
  status: string;

  @Exclude()
  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  createdAt: Date;

  @Exclude()
  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updatedAt: Date;

  @Exclude()
  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;
}

