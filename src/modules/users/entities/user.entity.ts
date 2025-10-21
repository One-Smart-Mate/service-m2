import { Exclude } from 'class-transformer';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  Index,
  Check,
} from 'typeorm';
import { UserRoleEntity } from 'src/modules/roles/entities/user-role.entity';
import { UserHasSitesEntity } from './user.has.sites.entity';
import { UsersPositionsEntity } from './users.positions.entity';

@Index('site_fast_password', ['siteId', 'fastPassword'], { unique: true })
@Index('user_email_unique_index', ['siteCode', 'email'], { unique: true })
@Check('chk_fast_password_alphanumeric', "fast_password REGEXP '^[a-zA-Z0-9]{1,6}$'")
@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ name: 'site_id', type: 'int', nullable: true })
  siteId?: number;

  @Column({ name: 'site_code', type: 'varchar', length: 6, nullable: true })
  siteCode?: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  name: string;

  @Column({ name: 'phone_number', type: 'varchar', length: 20, nullable: true })
  phoneNumber?: string;

  @Column({ type: 'varchar', length: 60, nullable: false })
  email: string;

  @Column({ name: 'email_verified_at', type: 'timestamp', nullable: true })
  emailVerifiedAt?: Date;

  @Column({ name: 'app_version', type: 'varchar', length: 15, nullable: true })
  appVersion?: string;

  @Column({
    name: 'evidence_resolution_images',
    type: 'tinyint',
    default: 0,
    nullable: false,
    comment: 'de 0 a 100',
  })
  evidenceResolutionImages: number;

  @Column({
    name: 'upload_card_data_with_data_net',
    type: 'tinyint',
    default: 0,
    nullable: false,
    comment:
      'If the value is 1, it means that it can upload cards with data network, if it is 0, it can only upload with wifi',
  })
  uploadCardDataWithDataNet: number;

  @Column({
    name: 'upload_card_evidence_with_data_net',
    type: 'tinyint',
    default: 0,
    nullable: false,
    comment:
      'If the value is 1, it means that it can upload evidence with data network, if it is 0, it can only upload with wifi',
  })
  uploadCardEvidenceWithDataNet: number;

  @Column({
    type: 'char',
    length: 1,
    default: 'A',
    nullable: false,
  })
  status: string;

  @Exclude()
  @Column({ type: 'varchar', length: 191, nullable: false })
  password: string;

  @Column({
    name: 'fast_password',
    type: 'varchar',
    length: 4,
    nullable: true,
    comment:
      'Used to identify users quickly; accepts alphanumeric values (a-z, A-Z, 0-9)',
  })
  fastPassword?: string;

  @Column({
    name: 'remember_token',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  rememberToken?: string;

  @Exclude()
  @Column({ name: 'reset_code', type: 'varchar', length: 60, nullable: true })
  resetCode?: string;

  @Exclude()
  @Column({
    name: 'reset_code_expiration',
    type: 'timestamp',
    nullable: true,
  })
  resetCodeExpiration?: Date;

  @Column({ name: 'app_token', type: 'text', nullable: true })
  appToken?: string;

  @Column({ name: 'ios_token', type: 'text', nullable: true })
  iosToken?: string;

  @Column({ name: 'android_token', type: 'text', nullable: true })
  androidToken?: string;

  @Column({ name: 'web_token', type: 'text', nullable: true })
  webToken?: string;

  @Column({
    name: 'android_version',
    type: 'varchar',
    length: 15,
    nullable: true,
  })
  androidVersion?: string;

  @Column({
    name: 'ios_version',
    type: 'varchar',
    length: 15,
    nullable: true,
  })
  iosVersion?: string;

  @Column({
    name: 'web_version',
    type: 'varchar',
    length: 15,
    nullable: true,
  })
  webVersion?: string;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  createdAt?: Date;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updatedAt?: Date;

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt?: Date;

  @Column({ name: 'last_login_web', type: 'timestamp', nullable: true })
  lastLoginWeb?: Date;

  @Column({ name: 'last_login_app', type: 'timestamp', nullable: true })
  lastLoginApp?: Date;

  @Column({ 
    type: 'varchar', 
    length: 2, 
    nullable: true, 
    default: 'ES',
    comment: 'User preferred language (ES/EN)' 
  })
  translation?: string | null;

  @OneToMany(() => UserRoleEntity, (userRole) => userRole.user)
  userRoles: UserRoleEntity[];

  @OneToMany(() => UserHasSitesEntity, (u) => u.user)
  userHasSites: UserHasSitesEntity[];

  @OneToMany(() => UsersPositionsEntity, (p) => p.user)
  usersPositions: UsersPositionsEntity[];
}
