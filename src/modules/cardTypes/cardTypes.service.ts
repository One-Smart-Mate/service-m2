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
      const activeCardTypesWithPreclassifiers = await this.cardTypesRepository
        .createQueryBuilder('cardTypes')
        .leftJoin('cardTypes.preclassifiers', 'preclassifiers')
        .where('cardTypes.siteId = :siteId', { siteId })
        .andWhere('cardTypes.status = :status', { status: stringConstants.A })
        .andWhere('preclassifiers.id IS NOT NULL')
        .distinct(true)
        .getMany();

      return activeCardTypesWithPreclassifiers;
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
      const foundCardTypes = await this.cardTypesRepository.findOneBy({
        id: updateCardTypesDTO.id,
      });
  
      if (!foundCardTypes) {
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
        foundCardTypes.responsableId = updateCardTypesDTO.responsableId;
        foundCardTypes.responsableName = foundUser.name;
        foundCardTypes.email = foundUser.email;
      }

      foundCardTypes.methodology = updateCardTypesDTO.methodology;
      foundCardTypes.name = updateCardTypesDTO.name;
      foundCardTypes.description = updateCardTypesDTO.description;
      foundCardTypes.quantityPicturesCreate = updateCardTypesDTO.quantityPicturesCreate;
      foundCardTypes.quantityAudiosCreate = updateCardTypesDTO.quantityAudiosCreate;
      foundCardTypes.quantityVideosCreate = updateCardTypesDTO.quantityVideosCreate;
      foundCardTypes.audiosDurationCreate = updateCardTypesDTO.audiosDurationCreate;
      foundCardTypes.videosDurationCreate = updateCardTypesDTO.videosDurationCreate;
      foundCardTypes.quantityPicturesClose = updateCardTypesDTO.quantityPicturesClose;
      foundCardTypes.quantityAudiosClose = updateCardTypesDTO.quantityAudiosClose;
      foundCardTypes.quantityVideosClose = updateCardTypesDTO.quantityVideosClose;
      foundCardTypes.audiosDurationClose = updateCardTypesDTO.audiosDurationClose;
      foundCardTypes.videosDurationClose = updateCardTypesDTO.videosDurationClose;
      foundCardTypes.quantityPicturesPs = updateCardTypesDTO.quantityPicturesPs;
      foundCardTypes.quantityAudiosPs = updateCardTypesDTO.quantityAudiosPs;
      foundCardTypes.audiosDurationPs = updateCardTypesDTO.audiosDurationPs;
      foundCardTypes.quantityVideosPs = updateCardTypesDTO.quantityVideosPs;
      foundCardTypes.videosDurationPs = updateCardTypesDTO.videosDurationPs;
      foundCardTypes.status = updateCardTypesDTO.status;
  
      if (updateCardTypesDTO.status !== stringConstants.A) {
        foundCardTypes.deletedAt = new Date();
      }
      foundCardTypes.updatedAt = new Date();
  
      let affectedRows = 0;

      if (updateCardTypesDTO.color !== foundCardTypes.color) {
        foundCardTypes.color = updateCardTypesDTO.color;
  

        const result = await this.cardsRepository
          .createQueryBuilder()
          .update()
          .set({ cardTypeColor: updateCardTypesDTO.color }) 
          .where('cardTypeId = :cardTypeId', { cardTypeId: foundCardTypes.id }) 
          .execute();
  
        affectedRows = result.affected;
      }
  
      const tokens = await this.usersService.getSiteUsersTokens(
        foundCardTypes.siteId,
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
        message: `Card type updated successfully.`,
        updatedCardsCount: affectedRows, 
        updatedCardType: await this.cardTypesRepository.save(foundCardTypes), 
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
