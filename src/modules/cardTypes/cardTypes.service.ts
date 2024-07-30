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
import { CardTypesCatalogEntity } from './entities/card.types.catalog.entity';
import { stringConstants } from 'src/utils/string.constant';
import { FirebaseService } from '../firebase/firebase.service';
import { NotificationDTO } from '../firebase/models/firebase.request.dto';

@Injectable()
export class CardTypesService {
  constructor(
    @InjectRepository(CardTypesEntity)
    private readonly cardTypesRepository: Repository<CardTypesEntity>,
    private readonly usersService: UsersService,
    private readonly siteService: SiteService,
    @InjectRepository(CardTypesCatalogEntity)
    private readonly cardTypesCatalogRepository: Repository<CardTypesCatalogEntity>,
    private readonly firebaseService: FirebaseService,
  ) {}

  findSiteActiveCardTypes = async (siteId: number) => {
    try {
      return await this.cardTypesRepository.findBy({
        siteId: siteId,
        status: stringConstants.A,
      });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

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

      const tokens = await this.usersService.getSiteUsersTokens(
        createCardTypesDTO.siteId,
      );
      await this.firebaseService.sendMultipleMessage(
        new NotificationDTO(
          stringConstants.catalogsTitle,
          stringConstants.catalogsDescription,
          stringConstants.catalogsNotificationType,
        ),
        tokens,
      );
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
        throw new NotFoundCustomException(
          NotFoundCustomExceptionType.CARDTYPES,
        );
      }

      if (updateCardTypesDTO.responsableId) {
        const foundUser = await this.usersService.findById(
          updateCardTypesDTO.responsableId,
        );
        if (!foundUser) {
          throw new NotFoundCustomException(NotFoundCustomExceptionType.USER);
        }
        foundCardTpyes.responsableId = updateCardTypesDTO.responsableId;
        foundCardTpyes.responsableName = foundUser.name;
        foundCardTpyes.email = foundUser.email;
      }

      foundCardTpyes.methodology = updateCardTypesDTO.methodology;
      foundCardTpyes.name = updateCardTypesDTO.name;
      foundCardTpyes.description = updateCardTypesDTO.description;
      foundCardTpyes.color = updateCardTypesDTO.color;
      foundCardTpyes.quantityPicturesCreate =
        updateCardTypesDTO.quantityPicturesCreate;
      foundCardTpyes.quantityAudiosCreate =
        updateCardTypesDTO.quantityAudiosCreate;
      foundCardTpyes.quantityVideosCreate =
        updateCardTypesDTO.quantityVideosCreate;
      foundCardTpyes.audiosDurationCreate =
        updateCardTypesDTO.audiosDurationCreate;
      foundCardTpyes.videosDurationCreate =
        updateCardTypesDTO.videosDurationCreate;
      foundCardTpyes.quantityPicturesClose =
        updateCardTypesDTO.quantityPicturesClose;
      foundCardTpyes.quantityAudiosClose =
        updateCardTypesDTO.quantityAudiosClose;
      foundCardTpyes.quantityVideosClose =
        updateCardTypesDTO.quantityVideosClose;
      foundCardTpyes.audiosDurationClose =
        updateCardTypesDTO.audiosDurationClose;
      foundCardTpyes.videosDurationClose =
        updateCardTypesDTO.videosDurationClose;
      foundCardTpyes.quantityPicturesPs = updateCardTypesDTO.quantityPicturesPs;
      foundCardTpyes.quantityAudiosPs = updateCardTypesDTO.quantityAudiosPs;
      foundCardTpyes.audiosDurationPs = updateCardTypesDTO.audiosDurationPs;
      foundCardTpyes.quantityVideosPs = updateCardTypesDTO.quantityVideosPs;
      foundCardTpyes.videosDurationPs = updateCardTypesDTO.videosDurationPs;

      foundCardTpyes.status = updateCardTypesDTO.status;
      if (updateCardTypesDTO.status !== stringConstants.A) {
        foundCardTpyes.deletedAt = new Date();
      }
      foundCardTpyes.updatedAt = new Date();

      const tokens = await this.usersService.getSiteUsersTokens(
        foundCardTpyes.siteId,
      );
      await this.firebaseService.sendMultipleMessage(
        new NotificationDTO(
          stringConstants.catalogsTitle,
          stringConstants.catalogsDescription,
          stringConstants.catalogsNotificationType,
        ),
        tokens,
      );
      return await this.cardTypesRepository.save(foundCardTpyes);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findById = async (id: number) => {
    try {
      return await this.cardTypesRepository.findOneBy({ id: id });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };
  findAllCatalogs = async () => {
    try {
      return await this.cardTypesCatalogRepository.find();
    } catch (exception) {
      HandleException.exception(exception);
    }
  };
}
