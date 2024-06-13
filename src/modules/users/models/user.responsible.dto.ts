import { Expose } from 'class-transformer';

export class UserResponsible {
  @Expose()
  id: number;
  @Expose()
  name: string;
  @Expose()
  email: string;
}
