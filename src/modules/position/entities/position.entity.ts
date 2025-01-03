import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { UsersPositionsEntity } from 'src/modules/users/entities/users.positions.entity';

@Entity('positions')
export class PositionEntity {
  @PrimaryGeneratedColumn({ name: 'ID', type: 'int', unsigned: true })
  id: number;

  @Column({ name: 'category', type: 'varchar', length: 45, nullable: true })
  category: string;

  @Column({ name: 'currency_id', type: 'int', nullable: true })
  currencyId: number;

  @Column({ name: 'currency_symbol', type: 'char', length: 3, nullable: true })
  currencySymbol: string;

  @Column({ name: 'description', type: 'varchar', length: 100, nullable: true })
  description: string;

  @Column({
    name: 'hour_cost',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  hourCost: number;

  @Column({ name: 'name', type: 'varchar', length: 45, nullable: true })
  name: string;

  @OneToMany(
    () => UsersPositionsEntity,
    (usersPositions) => usersPositions.position,
  )
  usersPositions: UsersPositionsEntity[];
}
