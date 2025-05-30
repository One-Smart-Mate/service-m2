import { Exclude } from 'class-transformer';
import { 
  Column, 
  Entity, 
  JoinColumn, 
  ManyToOne, 
  PrimaryGeneratedColumn 
} from 'typeorm';
import { LevelEntity } from 'src/modules/level/entities/level.entity';
import { OplMstr } from 'src/modules/oplMstr/entities/oplMstr.entity';
import { SiteEntity } from 'src/modules/site/entities/site.entity';

@Entity('opl_mstr_levels')
export class OplLevelsEntity {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id', unsigned: true })
  id: number;

  @Column({ name: 'site_id', type: 'int', unsigned: true, nullable: true })
  siteId: number | null;

  @Column({ name: 'opl_id', type: 'int', unsigned: true })
  oplId: number;

  @Column({ name: 'level_id', type: 'int', unsigned: true })
  levelId: number;

  @ManyToOne(() => OplMstr)
  @JoinColumn({ name: 'opl_id' })
  opl: OplMstr;

  @ManyToOne(() => LevelEntity)
  @JoinColumn({ name: 'level_id' })
  level: LevelEntity;

  @ManyToOne(() => SiteEntity)
  @JoinColumn({ name: 'site_id' })
  site: SiteEntity;

  @Exclude()
  @Column({ 
    name: 'created_at', 
    type: 'timestamp', 
    nullable: true, 
    default: () => 'CURRENT_TIMESTAMP' 
  })
  createdAt: Date | null;

  @Exclude()
  @Column({ 
    name: 'updated_at', 
    type: 'timestamp', 
    nullable: true, 
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP'
  })
  updatedAt: Date | null;

  @Exclude()
  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date | null;
}