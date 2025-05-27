import { Exclude } from 'class-transformer';
import { CiltSequencesEntity } from 'src/modules/ciltSequences/entities/ciltSequences.entity';
import { UserHasSitesEntity } from 'src/modules/users/entities/user.has.sites.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  OneToMany,
} from 'typeorm';

@Entity('sites')
@Index('idx_site_code', ['siteCode'], { unique: true })
export class SiteEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Exclude()
  @Column({ name: 'company_id', type: 'bigint', unsigned: true })
  companyId: number;

  @Column({ name: 'site_code', type: 'char', length: 6, unique: true })
  siteCode: string;

  @Exclude()
  @Column({ name: 'site_business_name', type: 'varchar', length: 100 })
  siteBusinessName: string;

  @Column({ name: 'site_name', type: 'varchar', length: 100 })
  name: string;

  @Exclude()
  @Column({ name: 'site_type', type: 'varchar', length: 20 })
  siteType: string;

  @Column({ type: 'varchar', length: 13 })
  rfc: string;

  @Column({ type: 'varchar', length: 200 })
  address: string;

  @Exclude()
  @Column({ type: 'varchar', length: 11, nullable: true })
  latitud: string;

  @Exclude()
  @Column({ type: 'varchar', length: 11, nullable: true })
  longitud: string;

  @Column({ type: 'varchar', length: 100 })
  contact: string;

  @Column({ type: 'varchar', length: 100 })
  position: string;

  @Column({ type: 'varchar', length: 13 })
  phone: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  extension: string;

  @Column({ type: 'varchar', length: 60 })
  email: string;

  @Column({ type: 'varchar', length: 13 })
  cellular: string;

  @Exclude()
  @Column({ name: 'due_date', type: 'date' })
  dueDate: string;

  @Exclude()
  @Column({ name: 'monthly_payment', type: 'decimal', precision: 12, scale: 2 })
  monthlyPayment: number;

  @Exclude()
  @Column({ type: 'char', length: 3 })
  currency: string;

  @Column({ name: 'url_logo', type: 'varchar', length: 200, nullable: true })
  logo: string;

  @Exclude()
  @Column({ name: 'app_history_days', type: 'smallint' })
  appHistoryDays: number;

  @Column({ type: 'char', length: 1, default: 'A' })
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

  @Column({ name: 'zip_code', type: 'char', length: 5, nullable: true })
  zipCode: string;

  @Column({
    name: 'user_license',
    type: 'enum',
    enum: ['concurrente', 'nombrado'],
    default: 'nombrado',
    nullable: true,
  })
  userLicense: 'concurrente' | 'nombrado';

  @Column({ name: 'user_quantity', type: 'int', nullable: true })
  userQuantity: number;

  @OneToMany(() => UserHasSitesEntity, (userHasSites) => userHasSites.site)
  userHasSites: UserHasSitesEntity[];

  @OneToMany(() => CiltSequencesEntity, (ciltSequences) => ciltSequences.site)
  ciltSequences: CiltSequencesEntity[];
}
