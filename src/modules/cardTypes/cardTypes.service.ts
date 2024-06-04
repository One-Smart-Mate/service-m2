import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CardTypesEntity } from './entities/cardTypes.entity';
import { Repository } from 'typeorm';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';
import {
  NotFoundCustomException,
  NotFoundCustomExceptionType,
} from 'src/common/exceptions/types/notFound.exception';
import { UsersService } from '../users/users.service';
import { CreateCardTypesDTO } from './dto/create.cardTypes.dto';
import { UpdateCardTypesDTO } from './dto/update.cardTypes.dto';
import { SiteService } from '../site/site.service';

@Injectable()
export class CardTypesService {
  constructor(
    @InjectRepository(CardTypesEntity)
    private readonly cardTypesRepository: Repository<CardTypesEntity>,
    private readonly usersService: UsersService,
    private readonly siteService: SiteService
  ) {}

  findSiteCardTypes = async (siteId: number) => {
    try {
      return await this.cardTypesRepository.findBy({ siteId: siteId });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  create = async (createCardTypesDTO: CreateCardTypesDTO) => {
    try {
      const foundSite = await this.siteService.findById(
        createCardTypesDTO.siteId,
      );

      if (!foundSite) {
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
      createCardTypesDTO.siteCode = foundSite.siteCode;

      return await this.cardTypesRepository.save(createCardTypesDTO);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  update = async (updateCardTypesDTO: UpdateCardTypesDTO) => {
    try {
      const foundCardTpyes = await this.cardTypesRepository.findOneBy({
        id: updateCardTypesDTO.id,
      });

      if (!foundCardTpyes) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.CARDTYPES,);
      }


      if (updateCardTypesDTO.responsableId) {
        const foundUser = await this.usersService.findById(
          updateCardTypesDTO.responsableId,
        );
        if (!foundUser) {
          throw new NotFoundCustomException(NotFoundCustomExceptionType.USER);
        }
        foundCardTpyes.responsableId = updateCardTypesDTO.responsableId
        foundCardTpyes.responsableName = foundUser.name;
        foundCardTpyes.email = foundUser.email;
      }

      foundCardTpyes.methodology = updateCardTypesDTO.methodology
      foundCardTpyes.name = updateCardTypesDTO.name
      foundCardTpyes.description = updateCardTypesDTO.description
      foundCardTpyes.color = updateCardTypesDTO.color
      foundCardTpyes.quantityPicturesCreate = updateCardTypesDTO.quantityPicturesCreate
      foundCardTpyes.quantityAudiosCreate = updateCardTypesDTO.quantityAudiosCreate
      foundCardTpyes.quantityVideosCreate = updateCardTypesDTO.quantityVideosCreate
      foundCardTpyes.audiosDurationCreate = updateCardTypesDTO.audiosDurationCreate
      foundCardTpyes.videosDurationCreate = updateCardTypesDTO.videosDurationCreate
      foundCardTpyes.quantityPicturesClose = updateCardTypesDTO.quantityPicturesClose
      foundCardTpyes.quantityAudiosClose = updateCardTypesDTO.quantityAudiosClose
      foundCardTpyes.quantityVideosClose = updateCardTypesDTO.quantityVideosClose
      foundCardTpyes.audiosDurationClose = updateCardTypesDTO.audiosDurationClose
      foundCardTpyes.videosDurationClose = updateCardTypesDTO.videosDurationClose
      foundCardTpyes.status = updateCardTypesDTO.status
      foundCardTpyes.updatedAt = new Date()

      return await this.cardTypesRepository.save(foundCardTpyes)

    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findById = async (id : number ) => {
    try {
      const cardTypeExist = await this.cardTypesRepository.existsBy({ id: id });

      if (!cardTypeExist) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.CARDTYPES);
      }

      return await this.cardTypesRepository.findOneBy({ id: id });
    } catch (exception) {
      HandleException.exception(exception);
    }
  }
}
