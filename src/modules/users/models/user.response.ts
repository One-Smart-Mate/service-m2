import { SiteEntity } from 'src/modules/site/entities/site.entity';
import { UserEntity } from '../entities/user.entity';

export class UserResponse {
  name: string;
  email: string;
  token: string;
  roles: string[];
  logo: string;
  companyId: number
  siteId: number

  constructor(user: UserEntity, token: string, roles: string[], site: SiteEntity) {
    this.name = user.name;
    this.email = user.email;
    this.token = token;
    this.roles = roles;
    this.logo = site.logo;
    this.companyId = site.companyId;
    this.siteId = site.id
  }
}
