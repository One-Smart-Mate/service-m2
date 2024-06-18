import { SiteEntity } from 'src/modules/site/entities/site.entity';
import { UserEntity } from '../entities/user.entity';

export class UserResponse {
  userId: number;
  name: string;
  email: string;
  token: string;
  roles: string[];
  logo: string;
  companyId: number;
  siteId: number;
  companyName: string;
  siteName: string;

  constructor(
    user: UserEntity,
    token: string,
    roles: string[],
    companyName: string,
  ) {
    this.userId = user.id
    this.name = user.name;
    this.email = user.email;
    this.token = token;
    this.roles = roles;
    this.logo = user.site.logo;
    this.companyId = user.site.companyId;
    this.siteId = user.site.id;
    this.companyName = companyName;
    this.siteName = user.site.name;
  }
}
