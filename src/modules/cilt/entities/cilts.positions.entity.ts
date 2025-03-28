import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
  } from 'typeorm';
  import { PositionEntity } from 'src/modules/position/entities/position.entity';
  import { CiltEntity } from 'src/modules/cilt/entities/cilt.entity';
  
  @Entity('positions_cilt')
  export class PositionsCiltEntity {
    @PrimaryGeneratedColumn({ type: 'int', name: 'ID' })
    id: number;
  
    @ManyToOne(() => PositionEntity, (position) => position.positionsCilt,{ onDelete: 'CASCADE' })
    @JoinColumn({ name: 'position_id', referencedColumnName: 'id' })
    position: PositionEntity;
  
    @ManyToOne(() => CiltEntity, (cilt) => cilt.positionsCilt,{ onDelete: 'CASCADE' })
    @JoinColumn({ name: 'cilt_id', referencedColumnName: 'id' })
    cilt: CiltEntity;
  }
  