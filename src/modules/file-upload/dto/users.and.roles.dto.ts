import { RoleEntity } from 'src/modules/roles/entities/role.entity';
import { UserEntity } from 'src/modules/users/entities/user.entity';

export class UsersAndRolesDTO {
  user: UserEntity;
  role: RoleEntity;
  createdAt: Date;
}
