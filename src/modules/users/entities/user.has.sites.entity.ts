import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { UserEntity } from './user.entity';
import { SiteEntity } from 'src/modules/site/entities/site.entity';

@Entity('user_has_sites')
export class UserHasSitesEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @ManyToOne(() => UserEntity, (user) => user.userHasSites)
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: UserEntity;

  @ManyToOne(() => SiteEntity, (site) => site.userHasSites)
  @JoinColumn({ name: 'site_id', referencedColumnName: 'id' })
  site: SiteEntity;
}
