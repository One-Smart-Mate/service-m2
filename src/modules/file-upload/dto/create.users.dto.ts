export class CreateUsersDTO {
  name: string;
  email: string;
  password: string;
  fastPassword: string;
  siteId: number;
  createdAt: Date;
  appVersion: string;
  siteCode: string;
  phoneNumber?: string;
  translation?: string;
}
