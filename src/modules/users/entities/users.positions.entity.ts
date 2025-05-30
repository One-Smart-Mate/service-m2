import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from './user.entity'; // Ajusta el path según tu proyecto
import { PositionEntity } from 'src/modules/position/entities/position.entity'; // Ajusta el path según tu proyecto
import { SiteEntity } from 'src/modules/site/entities/site.entity'; // Ajusta el path según tu proyecto
import { Exclude } from 'class-transformer';

@Entity('users_positions')
export class UsersPositionsEntity {
  @PrimaryGeneratedColumn({ type: 'int', name: 'ID', unsigned: true })
  id: number;

  @Column({ name: 'site_id', type: 'int', unsigned: true, nullable: true })
  siteId: number | null;

  @Column({ name: 'user_id', type: 'int', unsigned: true, nullable: true })
  userId: number | null;

  @Column({ name: 'position_id', type: 'int', unsigned: true, nullable: true })
  positionId: number | null;

  @Exclude()
  @Column({ 
    name: 'created_at', 
    type: 'timestamp', 
    nullable: true,
    default: () => 'CURRENT_TIMESTAMP'
  })
  createdAt: Date | null;

  @Exclude()
  @Column({ 
    name: 'updated_at', 
    type: 'timestamp', 
    nullable: true,
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP'
  })
  updatedAt: Date | null;

  @Exclude()
  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date | null;

  @ManyToOne(() => SiteEntity)
  @JoinColumn({ name: 'site_id' })
  site: SiteEntity;

  @ManyToOne(() => UserEntity, (user) => user.usersPositions)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @ManyToOne(() => PositionEntity, (position) => position.usersPositions)
  @JoinColumn({ name: 'position_id' })
  position: PositionEntity;
}