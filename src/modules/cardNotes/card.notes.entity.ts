import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';

@Entity('cards_notes') // Nombre de la tabla
export class CardNoteEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({name: 'card_id', type: 'bigint', unsigned: true })
  cardId: number;

  @Column({name: 'site_id', type: 'int', nullable: true })
  siteId: number | null;

  @Column({ type: 'varchar', length: 200 })
  note: string;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  createdAt: Date;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updatedAt: Date;

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;
}
