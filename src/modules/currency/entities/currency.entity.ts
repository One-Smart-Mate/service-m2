import { Exclude } from 'class-transformer';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('currencies')
export class CurrencyEntity {
    
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'currency_code', type: 'char', length: 3 })
  code: string;

  @Column({ name: 'currency_name', type: 'varchar', length: 45 })
  name: string;

  @Exclude()
  @Column({ name: 'currency_symbol', type: 'char', length: 3 })
  symbol: string;

  @Exclude()
  @Column({ type: 'smallint' })
  order

  @Exclude()
  @Column({ type: 'enum', enum: ['A', 'C'] })
  status: 'A' | 'C';

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
