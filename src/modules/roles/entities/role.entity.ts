import { UserRoleEntity } from 'src/modules/roles/entities/user-role.entity';
import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity('role')
export class RoleEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'text', nullable: true })
  name: string;

  @Exclude()
  @Column({ name: 'created_at', type: 'date', nullable: true })
  createdAt: Date;

  @Exclude()
  @OneToMany(() => UserRoleEntity, (userRole) => userRole.role)
  userRoles: UserRoleEntity[];
}
