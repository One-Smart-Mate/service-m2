import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SiteEntity } from './entities/site.entity';
import { Repository } from 'typeorm';

@Injectable()
export class SiteService {
  constructor(@InjectRepository(SiteEntity) private readonly siteRepository: Repository<SiteEntity>){}

  findCompanySites = async(companyId: number) => {
    return await this.siteRepository.findBy({companyId: companyId})
  }
}
