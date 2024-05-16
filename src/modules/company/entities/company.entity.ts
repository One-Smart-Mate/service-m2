import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('companies')
export class CompanyEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'company_business_name', type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 13 })
  rfc: string;

  @Column({ type: 'varchar', length: 200 })
  address: string;

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

  @Column({ type: 'varchar', length: 13, nullable: true })
  cellular: string;

  @Column({ name: 'url_logo', type: 'varchar', length: 500, nullable: true })
  logo: string;

  @Column({ type: 'char', length: 1, default: 'A' })
  status: string;

  @Column({
    name: 'created_at',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', nullable: true })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;

}
