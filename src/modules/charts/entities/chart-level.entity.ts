import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('charts_levels')
export class ChartLevel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'chart_id', type: 'int' })
  chartId: number;

  @Column({ type: 'int' })
  level: number;

  @Column({ name: 'level_name', type: 'varchar', length: 255 })
  levelName: string;

  @Column({ name: 'level_type', type: 'enum', enum: ['grouping', 'target'] })
  levelType: 'grouping' | 'target';

  @Column({ type: 'char', length: 1, default: 'A' })
  status: string;

  @Column({ type: 'int', nullable: true })
  order: number;
}
