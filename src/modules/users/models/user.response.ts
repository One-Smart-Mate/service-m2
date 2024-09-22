import { UserEntity } from '../entities/user.entity';

interface Site {
  id: number;
  name: string;
  logo: string;
}

export class UserResponse {
  userId: number;
  name: string;
  email: string;
  token: string;
  roles: string[];
  logo: string;
  companyId: number;
  companyName: string;
  sites: Site[];

  constructor(
    user: UserEntity,
    token: string,
    roles: string[],
    companyName: string,
  ) {
    this.userId = user.id;
    this.name = user.name;
    this.email = user.email;
    this.token = token;
    this.roles = roles;
    this.logo = user.userHasSites[0].site.logo;
    this.companyId = user.userHasSites[0].site.companyId;
    this.companyName = companyName;
    this.sites = user.userHasSites.map((userHasSite) => ({
      id: userHasSite.site.id,
      name: userHasSite.site.siteBusinessName,
      logo: userHasSite.site.logo,
    }));
  }
}
