import { SiteEntity } from 'src/modules/site/entities/site.entity';
import { UserEntity } from 'src/modules/users/entities/user.entity';

export class UsersAndSitesDTO {
  user: UserEntity;
  site: SiteEntity;
  createdAt: Date;
}
