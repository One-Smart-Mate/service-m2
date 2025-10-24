import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('charts')
export class Chart {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'site_id', type: 'int' })
  siteId: number;

  @Column({ name: 'chart_name', type: 'varchar', length: 255 })
  chartName: string;

  @Column({ name: 'chart_description', type: 'text', nullable: true })
  chartDescription: string;

  @Column({ name: 'root_node', type: 'int' })
  rootNode: number;

  @Column({ name: 'root_name', type: 'varchar', length: 255, nullable: true })
  rootName: string;

  @Column({ name: 'default_percentage', type: 'decimal', precision: 5, scale: 2, nullable: true })
  defaultPercentage: number;

  @Column({ type: 'char', length: 1, default: 'A' })
  status: string;

  @Column({ type: 'int', nullable: true })
  order: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', nullable: true })
  updatedAt: Date;
}
