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
  app_history: number;
  dueDate: string;
  lastLoginWeb: Date | null;
  lastLoginApp: Date | null;

  constructor(
    user: UserEntity,
    token: string,
    roles: string[],
    companyName: string,
    app_history: number,
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
      name: userHasSite.site.name,
      logo: userHasSite.site.logo,
    }));
    this.app_history = app_history;
    this.dueDate = user.userHasSites[0].site.dueDate;
    this.lastLoginWeb = user.lastLoginWeb;
    this.lastLoginApp = user.lastLoginApp;
  }
}
