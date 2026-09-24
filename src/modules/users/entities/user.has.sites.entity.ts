import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { SiteEntity } from 'src/modules/site/entities/site.entity';

@Entity('user_has_sites')
@Index('idx_uhs_user_state', ['user', 'deletedAt', 'status', 'site'])
@Index('idx_uhs_site_state', ['site', 'deletedAt', 'status', 'user'])
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
      'status specific to the user and site relationship; a user can have multiple sites but not necessarily be able to access all of them',
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
