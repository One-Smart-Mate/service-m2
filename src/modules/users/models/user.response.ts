import { SiteEntity } from 'src/modules/site/entities/site.entity';
import { UserEntity } from '../entities/user.entity';

export class UserResponse {
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
    site: SiteEntity,
  ) {
    this.name = user.name;
    this.email = user.email;
    this.token = token;
    this.roles = roles;
    this.logo = site.logo;
    this.companyId = site.companyId;
    this.siteId = site.id;
    this.companyName = companyName;
    this.siteName = site.name;
  }
}
