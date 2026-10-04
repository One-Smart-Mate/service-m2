export class CreateUsersDTO {
  name: string;
  email: string;
  password: string;
  fastPasswordDigest: string;
  siteId: number;
  createdAt: Date;
  appVersion: string;
  siteCode: string;
  phoneNumber?: string;
  translation?: string;
}
