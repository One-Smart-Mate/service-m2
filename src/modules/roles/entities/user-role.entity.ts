import { UserEntity } from 'src/modules/users/entities/user.entity';
import { RoleEntity } from 'src/modules/roles/entities/role.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
@Entity('user_role')
export class UserRoleEntity {
  @PrimaryGeneratedColumn({ name: 'id', type: 'bigint', unsigned: true })
  id: number;

  @ManyToOne(() => UserEntity, (user) => user.userRoles)
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: UserEntity;

  @ManyToOne(() => RoleEntity, (role) => role.userRoles)
  @JoinColumn({ name: 'role_id', referencedColumnName: 'id' })
  role: RoleEntity;

  @Column({ name: 'created_at', type: 'date', nullable: true })
  createdAt: Date;
}
