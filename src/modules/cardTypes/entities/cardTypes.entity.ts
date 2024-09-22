import { Exclude } from 'class-transformer';
import { PreclassifierEntity } from 'src/modules/preclassifier/entities/preclassifier.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

@Entity('card_types')
export class CardTypesEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'site_id', type: 'bigint', unsigned: true })
  siteId: number;

  @Exclude()
  @Column({ name: 'site_code', type: 'char', length: 6 })
  siteCode: string;

  @Column({ name: 'cardType_methodology', type: 'char', default: 'M' })
  cardTypeMethodology: string;

  @Column({ name: 'cardType_methodology_name', type: 'varchar', length: 25 })
  methodology: string;

  @Column({ name: 'cardType_name', type: 'varchar', length: 45 })
  name: string;

  @Column({ name: 'cardType_description', type: 'varchar', length: 100 })
  description: string;

  @Column({ type: 'varchar', length: 6 })
  color: string;

  @Column({
    name: 'responsable_id',
    type: 'bigint',
    unsigned: true,
    nullable: true,
  })
  responsableId: number;

  @Column({
    name: 'responsable_name',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  responsableName: string;

  @Column({ type: 'char', length: 1, default: 'A' })
  status: string;

  @Exclude()
  @Column({ type: 'varchar', length: 100, nullable: true })
  email: string;

  @Column({
    name: 'quantity_pictures_create',
    type: 'tinyint',
    unsigned: true,
    nullable: true,
  })
  quantityPicturesCreate: number;

  @Column({
    name: 'quantity_audios_create',
    type: 'tinyint',
    unsigned: true,
    nullable: true,
  })
  quantityAudiosCreate: number;

  @Column({
    name: 'quantity_videos_create',
    type: 'tinyint',
    unsigned: true,
    nullable: true,
  })
  quantityVideosCreate: number;

  @Column({
    name: 'audios_duration_create',
    type: 'int',
    unsigned: true,
    nullable: true,
  })
  audiosDurationCreate: number;

  @Column({
    name: 'videos_duration_create',
    type: 'int',
    unsigned: true,
    nullable: true,
  })
  videosDurationCreate: number;

  @Column({
    name: 'quantity_pictures_close',
    type: 'tinyint',
    unsigned: true,
    nullable: true,
  })
  quantityPicturesClose: number;

  @Column({
    name: 'quantity_audios_close',
    type: 'tinyint',
    unsigned: true,
    nullable: true,
  })
  quantityAudiosClose: number;

  @Column({
    name: 'quantity_videos_close',
    type: 'tinyint',
    unsigned: true,
    nullable: true,
  })
  quantityVideosClose: number;

  @Column({
    name: 'audios_duration_close',
    type: 'int',
    unsigned: true,
    nullable: true,
  })
  audiosDurationClose: number;

  @Column({
    name: 'videos_duration_close',
    type: 'int',
    unsigned: true,
    nullable: true,
  })
  videosDurationClose: number;

  @Exclude()
  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  createdAt: Date;

  @Exclude()
  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updatedAt: Date;

  @Exclude()
  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;

  @Column({ name: 'quantity_pictures_ps', type: 'tinyint', nullable: true })
  quantityPicturesPs: number;

  @Column({ name: 'quantity_audios_ps', type: 'tinyint', nullable: true })
  quantityAudiosPs: number;

  @Column({ name: 'quantity_videos_ps', type: 'tinyint', nullable: true })
  quantityVideosPs: number;

  @Column({ name: 'audios_duration_ps', type: 'int', nullable: true })
  audiosDurationPs: number;

  @Column({ name: 'videos_duration_ps', type: 'int', nullable: true })
  videosDurationPs: number;

  @OneToMany(
    () => PreclassifierEntity,
    (preclassifier) => preclassifier.cardType,
  )
  preclassifiers: PreclassifierEntity[];
}
