import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SiteEntity } from './entities/site.entity';
import { Repository } from 'typeorm';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';
import { CompanyService } from '../company/company.service';
import { CreateSiteDTO } from './models/dto/create-site.dto';
import { NotFoundCustomException, NotFoundCustomExceptionType } from 'src/common/exceptions/types/notFound.exception';
import { ValidationException, ValidationExceptionType } from 'src/common/exceptions/types/validation.exception';

@Injectable()
export class SiteService {
  constructor(@InjectRepository(SiteEntity) private readonly siteRepository: Repository<SiteEntity>, private readonly companyService: CompanyService){}

  findCompanySites = async(companyId: number) => {
    try{
      return await this.siteRepository.findBy({companyId: companyId})
    }catch(exception){
      HandleException.exception(exception)
    }
  }
  create = async(createSiteDTO:CreateSiteDTO) => {
    try{
      const existCompany = await this.companyService.findCompanyById(createSiteDTO.companyId)

      if(!existCompany){
        throw new NotFoundCustomException(NotFoundCustomExceptionType.COMPANY)
      }

      const emailIsNotUnique = await this.siteRepository.findOne({
        where: { email: createSiteDTO.email },
      });
      const rfcIsNotUnique = await this.siteRepository.findOne({
        where: { rfc: createSiteDTO.rfc },
      });
      const siteCodeIsNotUnique = await this.siteRepository.findOne({
        where: {siteCode: createSiteDTO.siteCode}
      })

      if (emailIsNotUnique || rfcIsNotUnique || siteCodeIsNotUnique) {
        throw new ValidationException(ValidationExceptionType.DUPLICATE_RECORD);
      }

      createSiteDTO.createdAt = new Date()

      return await this.siteRepository.save(createSiteDTO)

    }catch(exception){
      HandleException.exception(exception)
    }
  }
}
