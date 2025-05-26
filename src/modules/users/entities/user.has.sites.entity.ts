import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { SiteEntity } from 'src/modules/site/entities/site.entity';

@Entity('user_has_sites')
export class UserHasSitesEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @ManyToOne(() => UserEntity, (user) => user.userHasSites, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: UserEntity;

  @ManyToOne(() => SiteEntity, (site) => site.userHasSites, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'site_id', referencedColumnName: 'id' })
  site: SiteEntity;

  @Column({
    name: 'status',
    type: 'char',
    length: 1,
    default: 'A',
    nullable: true,
    comment:
      'status especifico para la relación de usuario y site; un usuario puede tener varios sites pero no necesariamente poder accesar a todos',
  })
  status: string;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
    nullable: true,
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
    nullable: true,
  })
  updatedAt: Date;

  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'timestamp',
    nullable: true,
  })
  deletedAt: Date;
}
