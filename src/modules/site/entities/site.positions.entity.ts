import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
  } from 'typeorm';
  import { SiteEntity } from 'src/modules/site/entities/site.entity'; // Ajusta el path según tu proyecto
  import { PositionEntity } from 'src/modules/position/entities/position.entity'; // Ajusta el path según tu proyecto
  
  @Entity('site_positions')
  export class SitePositionsEntity {
    @PrimaryGeneratedColumn({ type: 'int', name: 'ID' })
    id: number;
  
    @ManyToOne(() => SiteEntity, (site) => site.sitePositions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'site_id', referencedColumnName: 'id' })
    site: SiteEntity;
  
    @ManyToOne(() => PositionEntity, (position) => position.sitePositions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'position_id', referencedColumnName: 'id' })
    position: PositionEntity;
  }
  