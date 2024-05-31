import { Exclude } from 'class-transformer';
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity("card_types")
export class CardTypesEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Exclude()
  @Column({name: "site_id", type: 'bigint', unsigned: true })
  siteId: number;

  @Exclude()
  @Column({name: "site_code", type: 'char', length: 6 })
  siteCode: string;

  @Exclude()
  @Column({name: "cardType_methodology", type: 'enum', enum: ['M', 'C'], default: 'M' })
  cardTypeMethodology: 'M' | 'C';

  @Column({name: "cardType_methodology_name", type: 'varchar', length: 25 })
  methodology: string;

  @Column({name: "cardType_name", type: 'varchar', length: 45 })
  name: string;

  @Column({name: "cardType_description", type: 'varchar', length: 100 })
  description: string;

  @Column({ type: 'varchar', length: 6 })
  color: string;

  @Exclude()
  @Column({name: "responsable_id", type: 'bigint', unsigned: true, nullable: true })
  responsableId: number;

  @Column({name: "responsable_name", type: 'varchar', length: 100, nullable: true })
  responsableName: string;

  @Column({ type: 'char', length: 1, default: 'A' })
  status: string;

  @Exclude()
  @Column({ type: 'varchar', length: 100, nullable: true })
  email: string;

  @Exclude()
  @Column({name: "quantity_pictures_create", type: 'tinyint', unsigned: true, nullable: true })
  quantityPicturesCreate: number;

  @Exclude()
  @Column({name: "quantity_audios_create", type: 'tinyint', unsigned: true, nullable: true })
  quantityAudiosCreate: number;

  @Exclude()
  @Column({name: "quantity_videos_create", type: 'tinyint', unsigned: true, nullable: true })
  quantityVideosCreate: number;

  @Exclude()
  @Column({name: "audios_duration_create", type: 'int', unsigned: true, nullable: true })
  audiosDurationCreate: number;

  @Exclude()
  @Column({name: "videos_duration_create", type: 'int', unsigned: true, nullable: true })
  videosDurationCreate: number;

  @Exclude()
  @Column({name: "quantity_pictures_close", type: 'tinyint', unsigned: true, nullable: true })
  quantityPicturesClose: number;

  @Exclude()
  @Column({name: "quantity_audios_close", type: 'tinyint', unsigned: true, nullable: true })
  quantityAudiosClose: number;

  @Exclude()
  @Column({name: "quantity_videos_close", type: 'tinyint', unsigned: true, nullable: true })
  quantityVideosClose: number;

  @Exclude()
  @Column({name: "audios_duration_close", type: 'int', unsigned: true, nullable: true })
  audiosDurationClose: number;

  @Exclude()
  @Column({name: "videos_duration_close", type: 'int', unsigned: true, nullable: true })
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
}

