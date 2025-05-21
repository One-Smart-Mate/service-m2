import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CiltMstrEntity } from '../../ciltMstr/entities/ciltMstr.entity';
import { PositionEntity } from '../../position/entities/position.entity';
import { LevelEntity } from '../../level/entities/level.entity';

@Entity('cilt_mstr_position_levels')
export class CiltMstrPositionLevelsEntity {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true, name: 'id' })
  id: number;

  @Column({ type: 'bigint', unsigned: true, name: 'site_id' })
  siteId: number;

  @Column({ type: 'int', name: 'cilt_mstr_id' })
  ciltMstrId: number;

  @Column({ type: 'int', unsigned: true, name: 'position_id' })
  positionId: number;

  @Column({ type: 'bigint', unsigned: true, name: 'level_id' })
  levelId: number;

  @Column({ type: 'char', length: 1, name: 'status', default: 'A' })
  status: string;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp', name: 'deleted_at', nullable: true })
  deletedAt: Date | null;

  @ManyToOne(() => CiltMstrEntity)
  @JoinColumn({ name: 'cilt_mstr_id' })
  ciltMstr: CiltMstrEntity;

  @ManyToOne(() => PositionEntity)
  @JoinColumn({ name: 'position_id' })
  position: PositionEntity;

  @ManyToOne(() => LevelEntity)
  @JoinColumn({ name: 'level_id' })
  level: LevelEntity;
} 