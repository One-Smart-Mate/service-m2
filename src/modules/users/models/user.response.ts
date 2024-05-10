import { UserEntity } from '../entities/user.entity';

export class UserResponse {
  name: string;
  email: string;
  token: string;
  roles: string[];

  constructor(user: UserEntity, token: string, roles: string[]) {
    this.name = user.name;
    this.email = user.email;
    this.token = token;
    this.roles = roles;
  }
}
