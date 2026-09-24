import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PreclassifierEntity } from './entities/preclassifier.entity';
import { IsNull, Repository } from 'typeorm';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';
import { CreatePreclassifierDTO } from './models/dto/create-preclassifier.dto';
import { CardTypesService } from '../cardTypes/cardTypes.service';
import {
  NotFoundCustomException,
  NotFoundCustomExceptionType,
} from 'src/common/exceptions/types/notFound.exception';
import { UpdatePreclassifierDTO } from './models/dto/update-preclassifier.dto';
import { stringConstants } from 'src/utils/string.constant';
import { UsersService } from '../users/users.service';
import { FirebaseService } from '../firebase/firebase.service';
import { NotificationDTO } from '../firebase/models/firebase.request.dto';
import { applyCatalogLifecycle } from '../catalog/catalog-lifecycle';

@Injectable()
export class PreclassifierService {
  private readonly logger = new Logger(PreclassifierService.name);

  constructor(
    @InjectRepository(PreclassifierEntity)
    private readonly preclassifiersRepository: Repository<PreclassifierEntity>,
    private readonly cardTypeService: CardTypesService,
    private readonly userService: UsersService,
    private readonly firebaseService: FirebaseService,
  ) {}

  findCardTypesActivePreclassifiers = async (cardTypeId: number) => {
    try {
      return await this.preclassifiersRepository.findBy({
        cardTypeId: cardTypeId,
        status: stringConstants.A,
        deletedAt: IsNull(),
      });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findCardTypesPreclassifiers = async (cardTypeId: number) => {
    try {
      return await this.preclassifiersRepository.findBy({
        cardTypeId: cardTypeId,
      });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findSiteActivePreclassifiers = async (siteId: number) => {
    try {
      return await this.preclassifiersRepository.findBy({
        siteId: siteId,
        status: stringConstants.A,
        deletedAt: IsNull(),
      });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  create = async (createPreclassifierDTO: CreatePreclassifierDTO) => {
    try {
      const existCardType = await this.cardTypeService.findById(
        createPreclassifierDTO.cardTypeId,
      );
      if (
        !existCardType ||
        existCardType.status !== stringConstants.A ||
        existCardType.deletedAt != null
      ) {
        throw new NotFoundCustomException(
          NotFoundCustomExceptionType.CARDTYPES,
        );
      }

      createPreclassifierDTO.siteId = existCardType.siteId;
      createPreclassifierDTO.siteCode = existCardType.siteCode;
      createPreclassifierDTO.createdAt = new Date();

      const savedPreclassifier = await this.preclassifiersRepository.save(
        createPreclassifierDTO,
      );
      await this.notifyCatalogChange(createPreclassifierDTO.siteId);
      return savedPreclassifier;
    } catch (exception) {
      HandleException.exception(exception);
    }
  };
  update = async (updatePreclassifierDTO: UpdatePreclassifierDTO) => {
    try {
      const preclassifier = await this.preclassifiersRepository.findOneBy({
        id: updatePreclassifierDTO.id,
      });
      if (!preclassifier) {
        throw new NotFoundCustomException(
          NotFoundCustomExceptionType.PRECLASSIFIER,
        );
      }

      preclassifier.preclassifierCode =
        updatePreclassifierDTO.preclassifierCode;
      preclassifier.preclassifierDescription =
        updatePreclassifierDTO.preclassifierDescription;
      applyCatalogLifecycle(preclassifier, updatePreclassifierDTO.status);

      const savedPreclassifier = await this.preclassifiersRepository.save(
        preclassifier,
      );
      await this.notifyCatalogChange(preclassifier.siteId);
      return savedPreclassifier;
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findById = async (preclassifierId: number) => {
    try {
      return await this.preclassifiersRepository.findOneBy({
        id: preclassifierId,
      });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  private async notifyCatalogChange(siteId: number): Promise<void> {
    try {
      const tokens = await this.userService.getSiteUsersTokens(siteId, true);
      if (tokens.length === 0) {
        return;
      }
      await this.firebaseService.sendMultipleMessage(
        new NotificationDTO(
          stringConstants.catalogsTitle,
          stringConstants.catalogsDescription,
          stringConstants.catalogsNotificationType,
        ),
        tokens,
      );
    } catch (error) {
      this.logger.warn(
        `Preclassifier ${siteId} was saved but catalog notification failed`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
