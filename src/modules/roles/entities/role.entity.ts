import { UserEntity } from 'src/modules/users/entities/user.entity';
import { UserRoleEntity } from 'src/modules/roles/entities/user-role.entity';
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('role')
export class RoleEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'text', nullable: true })
  name: string;

  @Column({ name: 'created_at', type: 'date', nullable: true })
  createdAt: Date;

  @OneToMany(() => UserRoleEntity, (userRole) => userRole.role)
  userRoles: UserRoleEntity[];
}
