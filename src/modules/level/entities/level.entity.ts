import { Exclude } from 'class-transformer';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('levels')
export class LevelEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Exclude()
  @Column({ name: 'company_id', type: 'bigint', unsigned: true })
  companyId: number;

  @Exclude()
  @Column({ name: 'site_id', type: 'bigint', unsigned: true })
  siteId: number;

  @Column({ name: 'responsable_id', type: 'bigint', unsigned: true })
  responsibleId: number;

  @Column({
    name: 'responsable_name',
    type: 'varchar',
    length: 191,
    nullable: true,
  })
  responsibleName: string;

  @Column({ type: 'int', default: 0 })
  level: number;

  @Column({ name: 'superior_id', type: 'bigint', default: 0 })
  superiorId: number;

  @Column({ name: 'level_name', type: 'varchar', length: 45 })
  name: string;

  @Column({ name: 'level_description', type: 'varchar', length: 100 })
  description: string;

  @Column({ type: 'char', length: 1, default: 'A' })
  status: string;

  @Column({ name: 'level_machine_id', type: 'varchar', length: 50 })
  levelMachineId: string;

  @Column({type: 'tinyint', default: 1})
  notify: number;
  
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
