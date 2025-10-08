import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CardTypesEntity } from './entities/cardTypes.entity';
import { CardEntity } from '../card/entities/card.entity';
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
    @InjectRepository(CardEntity)
    private readonly cardsRepository: Repository<CardEntity>,
  ) {}

  findSiteActiveCardTypes = async (siteId: number) => {
    try {
      const activeCardTypes = await this.cardTypesRepository
        .createQueryBuilder('cardTypes')
        .where('cardTypes.siteId = :siteId', { siteId })
        .andWhere('cardTypes.status = :status', { status: stringConstants.A })
        .getMany();

      return activeCardTypes;
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
      const currentCardType = await this.cardTypesRepository.findOneBy({
        id: updateCardTypesDTO.id,
      });
  
      if (!currentCardType) {
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
        currentCardType.responsableId = updateCardTypesDTO.responsableId;
        currentCardType.responsableName = foundUser.name;
        currentCardType.email = foundUser.email;
      }
  
      currentCardType.methodology = updateCardTypesDTO.methodology;
      currentCardType.name = updateCardTypesDTO.name;
      currentCardType.description = updateCardTypesDTO.description;
      currentCardType.quantityPicturesCreate = updateCardTypesDTO.quantityPicturesCreate;
      currentCardType.quantityAudiosCreate = updateCardTypesDTO.quantityAudiosCreate;
      currentCardType.quantityVideosCreate = updateCardTypesDTO.quantityVideosCreate;
      currentCardType.audiosDurationCreate = updateCardTypesDTO.audiosDurationCreate;
      currentCardType.videosDurationCreate = updateCardTypesDTO.videosDurationCreate;
      currentCardType.quantityPicturesClose = updateCardTypesDTO.quantityPicturesClose;
      currentCardType.quantityAudiosClose = updateCardTypesDTO.quantityAudiosClose;
      currentCardType.quantityVideosClose = updateCardTypesDTO.quantityVideosClose;
      currentCardType.audiosDurationClose = updateCardTypesDTO.audiosDurationClose;
      currentCardType.videosDurationClose = updateCardTypesDTO.videosDurationClose;
      currentCardType.quantityPicturesPs = updateCardTypesDTO.quantityPicturesPs;
      currentCardType.quantityAudiosPs = updateCardTypesDTO.quantityAudiosPs;
      currentCardType.audiosDurationPs = updateCardTypesDTO.audiosDurationPs;
      currentCardType.quantityVideosPs = updateCardTypesDTO.quantityVideosPs;
      currentCardType.videosDurationPs = updateCardTypesDTO.videosDurationPs;
      currentCardType.status = updateCardTypesDTO.status;
  
      if (updateCardTypesDTO.status !== stringConstants.A) {
        currentCardType.deletedAt = new Date();
      }
      currentCardType.updatedAt = new Date();
  
      let affectedRows = 0;
  
      if (updateCardTypesDTO.color !== currentCardType.color) {
        currentCardType.color = updateCardTypesDTO.color;
  
        const result = await this.cardsRepository
          .createQueryBuilder()
          .update()
          .set({ cardTypeColor: updateCardTypesDTO.color }) 
          .where('cardTypeId = :cardTypeId', { cardTypeId: currentCardType.id }) 
          .execute();
  
        affectedRows = result.affected;
      }
  
      const tokens = await this.usersService.getSiteUsersTokens(
        currentCardType.siteId,
      );
      await this.firebaseService.sendMultipleMessage(
        new NotificationDTO(
          stringConstants.catalogsTitle,
          stringConstants.catalogsDescription,
          stringConstants.catalogsNotificationType,
        ),
        tokens,
      );
  
      const response = {
        message: stringConstants.cardTypeUpdate,
        updatedCardsCount: affectedRows, 
        updatedCardType: await this.cardTypesRepository.save(currentCardType), 
      };
  
      return response;
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
      return await this.cardTypesCatalogRepository.find({
        where: { status: stringConstants.A },
      });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };
}
