import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SiteEntity } from './entities/site.entity';
import { Repository } from 'typeorm';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';

@Injectable()
export class SiteService {
  constructor(@InjectRepository(SiteEntity) private readonly siteRepository: Repository<SiteEntity>){}

  findCompanySites = async(companyId: number) => {
    try{
      return await this.siteRepository.findBy({companyId: companyId})
    }catch(exception){
      HandleException.exception(exception)
    }
  }
}
