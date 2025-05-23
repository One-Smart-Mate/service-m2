import { Exclude } from 'class-transformer';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { LevelEntity } from 'src/modules/level/entities/level.entity';
import { OplMstr } from 'src/modules/oplMstr/entities/oplMstr.entity';

@Entity('opl_mstr_levels')
export class OplLevelsEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'opl_id', type: 'int' })
  oplId: number;

  @Column({ name: 'level_id', type: 'bigint', unsigned: true })
  levelId: number;

  @ManyToOne(() => OplMstr, (oplMstr) => oplMstr.id)
  @JoinColumn({ name: 'opl_id' })
  opl: OplMstr;

  @ManyToOne(() => LevelEntity, (level) => level.id)
  @JoinColumn({ name: 'level_id' })
  level: LevelEntity;

  @Exclude()
  @Column({ name: 'created_at', type: 'timestamp', nullable: true, default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Exclude()
  @Column({ name: 'updated_at', type: 'timestamp', nullable: true, default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @Exclude()
  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;
} 