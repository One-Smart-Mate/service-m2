import { RoleEntity } from 'src/modules/roles/entities/role.entity';
import { UserRoleEntity } from 'src/modules/roles/entities/user-role.entity';
import { SiteEntity } from 'src/modules/site/entities/site.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  OneToOne,
  JoinColumn,
} from 'typeorm';

@Entity('users')
@Index(['siteCode'], { unique: true })
export class UserEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;


  @OneToOne(()=> SiteEntity)
  @JoinColumn({name: 'site_id'})
  site: SiteEntity;

  @Column({ name: 'site_code', type: 'varchar', length: 6, nullable: false })
  siteCode: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  name: string;

  @Column({ type: 'varchar', length: 60, nullable: false })
  email: string;

  @Column({ name: 'email_verified_at', type: 'timestamp', nullable: true })
  emailVerifiedAt: Date;

  @Column({ name: 'app_version', type: 'varchar', length: 15, nullable: true })
  appVersion: string;

  @Column({
    name: 'evidence_resolution_images',
    type: 'tinyint',
    width: 4,
    nullable: false,
    default: 0,
  })
  evidenceResolutionImages: number;

  @Column({
    name: 'upload_card_data_With_data_net',
    type: 'tinyint',
    width: 4,
    nullable: false,
    default: 0,
  })
  uploadCardDataWithDataNet: number;

  @Column({
    name: 'upload_card_evidence_With_data_net',
    type: 'tinyint',
    width: 4,
    nullable: false,
    default: 0,
  })
  uploadCardEvidenceWithDataNet: number;

  @Column({ type: 'char', length: 1, nullable: false, default: 'A' })
  status: string;

  @Column({ type: 'varchar', length: 191, nullable: false })
  password: string;

  @Column({
    name: 'remember_token',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  rememberToken: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', nullable: true })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', nullable: true })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;

  @OneToMany(() => UserRoleEntity, (userRole) => userRole.user)
  userRoles: UserRoleEntity[];
}
