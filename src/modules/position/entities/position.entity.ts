import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { UsersPositionsEntity } from 'src/modules/users/entities/users.positions.entity';
import { Exclude } from 'class-transformer';
import { CiltSequencesEntity } from 'src/modules/ciltSequences/entities/ciltSequences.entity';

@Entity('positions')
export class PositionEntity {
  @PrimaryGeneratedColumn({ name: 'id', type: 'int', unsigned: true })
  id: number;

  @Column({ name: 'site_id', type: 'int', nullable: true })
  siteId: number;

  @Column({ name: 'site_name', type: 'varchar', length: 100, nullable: true })
  siteName: string;

  @Column({ name: 'site_type', type: 'varchar', length: 20, nullable: true })
  siteType: string;

  @Column({ name: 'area_id', type: 'int', nullable: true })
  areaId: number;

  @Column({ name: 'area_name', type: 'varchar', length: 100, nullable: true })
  areaName: string;

  @Column({ name: 'level_id', type: 'int', nullable: true })
  levelId: number;

  @Column({ name: 'level_name', type: 'varchar', length: 45, nullable: true })
  levelName: string;

  @Column({ name: 'node_responsable_id', type: 'int', nullable: true })
  nodeResponsableId: number;

  @Column({ name: 'node_responsable_name', type: 'varchar', length: 100, nullable: true })
  nodeResponsableName: string;

  @Column({ name: 'route', type: 'varchar', length: 250, nullable: true })
  route: string;

  @Column({ name: 'name', type: 'varchar', length: 45, nullable: true })
  name: string;

  @Column({ name: 'description', type: 'varchar', length: 100, nullable: true })
  description: string;

  @Column({ name: 'status', type: 'char', length: 1, nullable: true, default: 'A' })
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

  @OneToMany(
    () => UsersPositionsEntity,
    (usersPositions) => usersPositions.position,
  )
  usersPositions: UsersPositionsEntity[];

  @OneToMany(
    () => CiltSequencesEntity,
    (ciltSequences) => ciltSequences.position,
  )
  ciltSequences: CiltSequencesEntity[];
}
