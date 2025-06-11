import { 
  Column, 
  Entity, 
  OneToMany, 
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { UsersPositionsEntity } from 'src/modules/users/entities/users.positions.entity';
import { SiteEntity } from 'src/modules/site/entities/site.entity';
import { LevelEntity } from 'src/modules/level/entities/level.entity';
import { UserEntity } from 'src/modules/users/entities/user.entity';
import { Exclude } from 'class-transformer';

@Entity('positions')
export class PositionEntity {
  @PrimaryGeneratedColumn({ name: 'id', type: 'int', unsigned: true })
  id: number;

  @Column({ name: 'site_id', type: 'int', unsigned: true, nullable: true })
  siteId: number | null;

  @Column({ name: 'site_name', type: 'varchar', length: 100, nullable: true })
  siteName: string | null;

  @Column({ name: 'site_type', type: 'varchar', length: 20, nullable: true })
  siteType: string | null;

  @Column({ name: 'area_id', type: 'int', unsigned: true, nullable: true })
  areaId: number | null;

  @Column({ name: 'area_name', type: 'varchar', length: 100, nullable: true })
  areaName: string | null;

  @Column({ name: 'level_id', type: 'int', unsigned: true, nullable: true })
  levelId: number | null;

  @Column({ name: 'level_name', type: 'varchar', length: 45, nullable: true })
  levelName: string | null;

  @Column({ name: 'node_responsable_id', type: 'int', unsigned: true, nullable: true })
  nodeResponsableId: number | null;

  @Column({ name: 'node_responsable_name', type: 'varchar', length: 100, nullable: true })
  nodeResponsableName: string | null;

  @Column({ name: 'node_responsable_id', type: 'int', nullable: true })
  nodeResponsableId: number;

  @Column({ name: 'node_responsable_name', type: 'varchar', length: 100, nullable: true })
  nodeResponsableName: string;

  @Column({ name: 'route', type: 'varchar', length: 250, nullable: true })
  route: string | null;

  @Column({ name: 'order', type: 'tinyint', nullable: false, default: 1 })
  order: number;

  @Column({ name: 'name', type: 'varchar', length: 45, nullable: true })
  name: string | null;

  @Column({ name: 'description', type: 'varchar', length: 100, nullable: true })
  description: string | null;

  @Column({ name: 'status', type: 'char', length: 1, nullable: true, default: 'A' })
  status: string | null;

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

  @ManyToOne(() => SiteEntity)
  @JoinColumn({ name: 'site_id' })
  site: SiteEntity;

  @ManyToOne(() => LevelEntity)
  @JoinColumn({ name: 'area_id' })
  area: LevelEntity;

  @ManyToOne(() => LevelEntity)
  @JoinColumn({ name: 'level_id' })
  level: LevelEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'node_responsable_id' })
  nodeResponsable: UserEntity;

  @OneToMany(
    () => UsersPositionsEntity,
    (usersPositions) => usersPositions.position,
  )
  usersPositions: UsersPositionsEntity[];
}