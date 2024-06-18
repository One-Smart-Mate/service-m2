import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SiteEntity } from './entities/site.entity';
import { Not, Repository } from 'typeorm';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';
import { CompanyService } from '../company/company.service';
import { CreateSiteDTO } from './models/dto/create-site.dto';
import { NotFoundCustomException, NotFoundCustomExceptionType } from 'src/common/exceptions/types/notFound.exception';
import { ValidationException, ValidationExceptionType } from 'src/common/exceptions/types/validation.exception';
import { UpadeSiteDTO } from './models/dto/update.site.dto';

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
  update = async (updateSiteDTO: UpadeSiteDTO) => {
    try{
      const site = await this.siteRepository.findOneBy({id: updateSiteDTO.id})

      if(!site){
        throw new NotFoundCustomException(NotFoundCustomExceptionType.SITE)
      }
      
      site.siteCode = updateSiteDTO.siteCode
      site.siteBusinessName = updateSiteDTO.siteBusinessName
      site.name = updateSiteDTO.name;
      site.siteType = updateSiteDTO.siteType
      site.address = updateSiteDTO.address;
      site.cellular = updateSiteDTO.cellular;
      site.contact = updateSiteDTO.contact;
      site.email = updateSiteDTO.email;
      site.extension = updateSiteDTO.extension;
      site.logo = updateSiteDTO.logo;
      site.phone = updateSiteDTO.phone;
      site.position = updateSiteDTO.position;
      site.rfc = updateSiteDTO.rfc;
      site.latitud = updateSiteDTO.latitud
      site.longitud = updateSiteDTO.longitud
      site.dueDate = updateSiteDTO.dueDate
      site.monthlyPayment = updateSiteDTO.monthlyPayment
      site.currency = updateSiteDTO.currency
      site.appHistoryDays = updateSiteDTO.appHistoryDays
      site.status = updateSiteDTO.status;
      site.updatedAt = new Date();

      const emailIsNotUnique = await this.siteRepository.findOne({
        where: { id: Not(site.id), email: site.email },
      });
      const rfcIsNotUnique = await this.siteRepository.findOne({
        where: { id: Not(site.id), rfc: site.rfc },
      });
      const siteCodeIsNotUnique = await this.siteRepository.findOne({
        where: { id: Not(site.id), siteCode: site.siteCode },
      });

      if (emailIsNotUnique || rfcIsNotUnique || siteCodeIsNotUnique) {
        throw new ValidationException(ValidationExceptionType.DUPLICATE_RECORD);
      }

      return await this.siteRepository.save(site)
    }catch(exception){
      HandleException.exception(exception)
    }
  }

  findById = async(id: number) =>{
    try {
      const siteExists = await this.siteRepository.existsBy({ id: id });

      if (!siteExists) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.SITE);
      }

      return await this.siteRepository.findOneBy({ id: id });
    } catch (exception) {
      HandleException.exception(exception);
    }
  }

  getLogoByUserSiteId = async (userSiteId: number) => {
    try{
      const {logo} = await this.siteRepository.findOne({where: {id: userSiteId}, select: ['logo']})
      return logo
    }catch(exception){
      HandleException.exception(exception)
    }
  }
  getCompanyName = async (companyId: number) =>{
    try{
      const {name} = await this.companyService.findCompanyById(companyId)
      return name
    }catch(exception){
      HandleException.exception(exception)
    }
  } 
}
