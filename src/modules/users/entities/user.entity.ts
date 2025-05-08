import { Exclude } from 'class-transformer';
import { RoleEntity } from 'src/modules/roles/entities/role.entity';
import { UserRoleEntity } from 'src/modules/roles/entities/user-role.entity';
import { SiteEntity } from 'src/modules/site/entities/site.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { UserHasSitesEntity } from './user.has.sites.entity';
import { UsersPositionsEntity } from './users.positions.entity';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

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

  @Exclude()
  @Column({ type: 'varchar', length: 191, nullable: false })
  password: string;

  @Column({
    name: 'remember_token',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  rememberToken: string;

  @Exclude()
  @Column({ name: 'reset_code', type: 'varchar', length: 30, nullable: true })
  resetCode: string;
  @Exclude()
  @Column({ name: 'reset_code_expiration', type: 'timestamp', nullable: true })
  resetCodeExpiration: Date;

  @Column({ name: 'app_token', type: 'varchar', length: 100, nullable: true })
  appToken: string;
  
  @Column({ name: 'ios_token', type: 'varchar', length: 100, nullable: true })
  ios_token: string;

  @Column({ name: 'android_token', type: 'varchar', length: 100, nullable: true })
  android_token: string;

  @Column({ name: 'web_token', type: 'varchar', length: 100, nullable: true })
  web_token: string;

  @Column({ name: 'android_version', type: 'varchar', length: 15, nullable: true })
  androidVersion: string;

  @Column({ name: 'ios_version', type: 'varchar', length: 15, nullable: true })
  iosVersion: string;

  @Column({ name: 'web_version', type: 'varchar', length: 15, nullable: true })
  webVersion: string;

  @Column({ name: 'fast_password', type: 'varchar', length: 6, nullable: true })
  fastPassword: string;

  @Column({ name: 'last_login_web', type: 'timestamp', nullable: true })
  lastLoginWeb: Date;

  @Column({ name: 'last_login_app', type: 'timestamp', nullable: true })
  lastLoginApp: Date;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  createdAt: Date;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updatedAt: Date;

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;

  @OneToMany(() => UserRoleEntity, (userRole) => userRole.user)
  userRoles: UserRoleEntity[];

  @OneToMany(() => UserHasSitesEntity, (userHasSites) => userHasSites.user)
  userHasSites: UserHasSitesEntity[];

  @OneToMany(() => UsersPositionsEntity, (usersPositions) => usersPositions.user)
  usersPositions: UsersPositionsEntity[];

}
