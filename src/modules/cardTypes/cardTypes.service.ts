import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CardTypesEntity } from './entities/cardTypes.entity';
import { Repository } from 'typeorm';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';
import {
  NotFoundCustomException,
  NotFoundCustomExceptionType,
} from 'src/common/exceptions/types/notFound.exception';
import { CompanyService } from '../company/company.service';
import { UsersService } from '../users/users.service';
import { stringConstants } from 'src/utils/string.constant';
import { CreateCardTypesDTO } from './dto/create.cardTypes.dto';

@Injectable()
export class CardTypesService {
  constructor(
    @InjectRepository(CardTypesEntity)
    private readonly cardTypesRepository: Repository<CardTypesEntity>,
    private readonly companyService: CompanyService,
    private readonly usersService: UsersService,
  ) {}

  findCompanyCardTypes = async (companyId: number) => {
    try {
      const existCompanyCardTypes = await this.cardTypesRepository.existsBy({
        siteId: companyId,
      });

      if (!existCompanyCardTypes) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.COMPANY);
      }

      return await this.cardTypesRepository.findBy({ siteId: companyId });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  create = async (createCardTypesDTO: CreateCardTypesDTO) => {
    try {
      const foundCompany = await this.companyService.findCompanyById(
        createCardTypesDTO.siteId,
      );

      if (!foundCompany) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.COMPANY);
      }

      if (createCardTypesDTO.responsableId) {
        const foundUser = await this.usersService.findById(
          createCardTypesDTO.responsableId,
        );
        if (!foundUser) {
          throw new NotFoundCustomException(NotFoundCustomExceptionType.USER);
        }
        createCardTypesDTO.responsableName = foundUser.name;
        createCardTypesDTO.email = foundUser.email;
      }

      createCardTypesDTO.createdAt = new Date();
      createCardTypesDTO.siteCode = stringConstants.hardCodedSiteCode;

      return await this.cardTypesRepository.save(createCardTypesDTO);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };
}
