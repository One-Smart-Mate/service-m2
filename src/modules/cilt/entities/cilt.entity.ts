import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { PositionsCiltEntity } from 'src/modules/cilt/entities/cilts.positions.entity';
import { RepositoryEntity } from 'src/modules/repository/entities/repository.entity';
import { Exclude } from 'class-transformer';

@Entity('cilt')
export class CiltEntity {
  @PrimaryGeneratedColumn({ name: 'ID', type: 'int', unsigned: true })
  id: number;

  @Column({ name: 'name', type: 'varchar', length: 255, nullable: false })
  name: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string;

  @Column({ name: 'tools_required', type: 'text', nullable: true })
  toolsRequired: string;

  @Column({ name: 'standard_ok', type: 'boolean', default: false })
  standardOk: boolean;

  @Column({
    name: 'repository_url',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  repositoryUrl: string;

  @Exclude()
  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @Exclude()
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @Exclude()
  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;

  @OneToMany(() => PositionsCiltEntity, (positionsCilt) => positionsCilt.cilt)
  positionsCilt: PositionsCiltEntity[];

  @OneToMany(() => RepositoryEntity, (repository) => repository.cilt)
  repositories: RepositoryEntity[];
}
