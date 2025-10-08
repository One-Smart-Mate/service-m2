import { Exclude } from 'class-transformer';
import { CardTypesEntity } from 'src/modules/cardTypes/entities/cardTypes.entity';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity('preclassifiers')
export class PreclassifierEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'cardType_id', type: 'bigint', unsigned: true })
  cardTypeId: number;

  @ManyToOne(() => CardTypesEntity, (cardType) => cardType.preclassifiers)
  @JoinColumn({ name: 'cardType_id' })
  cardType: CardTypesEntity;

  @Exclude()
  @Column({ name: 'site_id', type: 'bigint', unsigned: true })
  siteId: number;

  @Exclude()
  @Column({ name: 'site_code', type: 'char', length: 6 })
  siteCode: string;

  @Column({ name: 'preclassifier_code', type: 'char', length: 6 })
  preclassifierCode: string;

  @Column({ name: 'preclassifier_description', type: 'varchar', length: 100 })
  preclassifierDescription: string;

  @Column({ type: 'char', length: 1, nullable: true, default: 'A' })
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
}
