import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('card_types_catalog')
export class CardTypesCatalogEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({name: 'cardType_methodology', type: 'char', length: 5, nullable: true })
  cardTypeMethodology: string;

  @Column({name: 'cardType_methodology_name', type: 'varchar', length: 25, nullable: true })
  cardTypeMethodologyName: string;
}
