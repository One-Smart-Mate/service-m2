import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SiteEntity } from './entities/site.entity';
import { Not, Repository } from 'typeorm';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';
import { CompanyService } from '../company/company.service';
import { CreateSiteDTO } from './models/dto/create-site.dto';
import {
  NotFoundCustomException,
  NotFoundCustomExceptionType,
} from 'src/common/exceptions/types/notFound.exception';
import {
  ValidationException,
  ValidationExceptionType,
} from 'src/common/exceptions/types/validation.exception';
import { UpadeSiteDTO } from './models/dto/update.site.dto';
import { UserEntity } from '../users/entities/user.entity';

@Injectable()
export class SiteService {
  constructor(
    @InjectRepository(SiteEntity)
    private readonly siteRepository: Repository<SiteEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly companyService: CompanyService,
  ) {}

  findCompanySites = async (companyId: number) => {
    try {
      return await this.siteRepository.findBy({ companyId: companyId });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };
  create = async (createSiteDTO: CreateSiteDTO) => {
    try {
      const existCompany = await this.companyService.findCompanyById(
        createSiteDTO.companyId,
      );

      if (!existCompany) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.COMPANY);
      }

      const emailIsNotUnique = await this.siteRepository.findOne({
        where: { email: createSiteDTO.email },
      });
      const rfcIsNotUnique = await this.siteRepository.findOne({
        where: { rfc: createSiteDTO.rfc },
      });
      const siteCodeIsNotUnique = await this.siteRepository.findOne({
        where: { siteCode: createSiteDTO.siteCode },
      });

      if (emailIsNotUnique || rfcIsNotUnique || siteCodeIsNotUnique) {
        throw new ValidationException(ValidationExceptionType.DUPLICATE_RECORD);
      }

      createSiteDTO.createdAt = new Date();

      return await this.siteRepository.save(createSiteDTO);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };
  update = async (updateSiteDTO: UpadeSiteDTO) => {
    try {
      const site = await this.siteRepository.findOneBy({
        id: updateSiteDTO.id,
      });

      if (!site) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.SITE);
      }

      site.siteCode = updateSiteDTO.siteCode;
      site.siteBusinessName = updateSiteDTO.siteBusinessName;
      site.name = updateSiteDTO.name;
      site.siteType = updateSiteDTO.siteType;
      site.address = updateSiteDTO.address;
      site.cellular = updateSiteDTO.cellular;
      site.contact = updateSiteDTO.contact;
      site.email = updateSiteDTO.email;
      site.extension = updateSiteDTO.extension;
      site.logo = updateSiteDTO.logo;
      site.phone = updateSiteDTO.phone;
      site.position = updateSiteDTO.position;
      site.rfc = updateSiteDTO.rfc;
      site.latitud = updateSiteDTO.latitud;
      site.longitud = updateSiteDTO.longitud;
      site.dueDate = updateSiteDTO.dueDate;
      site.monthlyPayment = updateSiteDTO.monthlyPayment;
      site.currency = updateSiteDTO.currency;
      site.appHistoryDays = updateSiteDTO.appHistoryDays;
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

      return await this.siteRepository.save(site);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findById = async (id: number) => {
    try {
      const siteExists = await this.siteRepository.existsBy({ id: id });

      if (!siteExists) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.SITE);
      }

      return await this.siteRepository.findOneBy({ id: id });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findUserSitesId = async (userId: number) => {
    try {
      return await this.siteRepository.find({
        where: { userHasSites: { user: { id: userId } } },
      });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  getLogoByUserSiteId = async (userSiteId: number) => {
    try {
      const { logo } = await this.siteRepository.findOne({
        where: { id: userSiteId },
        select: ['logo'],
      });
      return logo;
    } catch (exception) {
      HandleException.exception(exception);
    }
  };
  getCompanyName = async (companyId: number) => {
    try {
      const { name } = await this.companyService.findCompanyById(companyId);
      return name;
    } catch (exception) {
      HandleException.exception(exception);
    }
  };
  findAll = async () => {
    try {
      return await this.siteRepository.find();
    } catch (exceptino) {
      HandleException.exception(exceptino);
    }
  };

  getSiteNameById = async (siteId: number) => {
    try {
      const { siteBusinessName } = await this.siteRepository.findOne({
        where: { id: siteId },
        select: { siteBusinessName: true },
      });
      return siteBusinessName;
    } catch (exceptino) {
      HandleException.exception(exceptino);
    }
  };

  findUsersWithRolesAndPositions = async (siteId: number) => {
    try {
      const users = await this.userRepository.find({
        where: { userHasSites: { site: { id: siteId } } },
        relations: { 
          userRoles: { role: true },
          usersPositions: { position: true }
        },
      });

      return users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        translation: user.translation,
        status: user.status,
        uploadCardDataWithDataNet: user.uploadCardDataWithDataNet,
        uploadCardEvidenceWithDataNet: user.uploadCardEvidenceWithDataNet,
        lastLoginWeb: user.lastLoginWeb,
        lastLoginApp: user.lastLoginApp,
        roles: user.userRoles.map((userRole) => ({
          id: userRole.role.id,
          name: userRole.role.name
        })),
        positions: user.usersPositions.map((userPosition) => ({
          id: userPosition.position.id,
          name: userPosition.position.name,
          description: userPosition.position.description,
          route: userPosition.position.route,
          levelId: userPosition.position.levelId,
          levelName: userPosition.position.levelName,
          areaId: userPosition.position.areaId,
          areaName: userPosition.position.areaName,
          siteId: userPosition.position.siteId,
          siteName: userPosition.position.siteName,
          siteType: userPosition.position.siteType,
          status: userPosition.position.status
        }))
      }));
    } catch (exception) {
      HandleException.exception(exception);
    }
  };
}
