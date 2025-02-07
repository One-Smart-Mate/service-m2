import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
  } from 'typeorm';
  import { UserEntity } from './user.entity'; // Ajusta el path según tu proyecto
  import { PositionEntity } from 'src/modules/position/entities/position.entity'; // Ajusta el path según tu proyecto
  
  @Entity('users_positions')
  export class UsersPositionsEntity {
    @PrimaryGeneratedColumn({ type: 'int',name:'ID'})
    id: number;
  
    @ManyToOne(() => UserEntity, (user) => user.usersPositions)
    @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
    user: UserEntity;
  
    @ManyToOne(() => PositionEntity, (position) => position.usersPositions)
    @JoinColumn({ name: 'position_id', referencedColumnName: 'id' })
    position: PositionEntity;

  }
  