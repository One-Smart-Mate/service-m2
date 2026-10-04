import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PriorityEntity } from './entities/priority.entity';
import { Repository } from 'typeorm';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';
import {
  NotFoundCustomException,
  NotFoundCustomExceptionType,
} from 'src/common/exceptions/types/notFound.exception';
import { ValidationException, ValidationExceptionType } from 'src/common/exceptions/types/validation.exception';
import { CreatePriorityDTO } from './models/dto/create.priority.dto';
import { stringConstants } from 'src/utils/string.constant';
import { UpdatePriorityDTO } from './models/dto/update.priority.dto';
import { SiteService } from '../site/site.service';
import { UsersService } from '../users/users.service';
import { FirebaseService } from '../firebase/firebase.service';
import { NotificationDTO } from '../firebase/models/firebase.request.dto';
import { IsNull, Not } from 'typeorm';
import { applyCatalogLifecycle } from '../catalog/catalog-lifecycle';
import { assertActiveCatalogSite } from '../catalog/catalog-assignment.policy';

@Injectable()
export class PriorityService {
  private readonly logger = new Logger(PriorityService.name);

  constructor(
    @InjectRepository(PriorityEntity)
    private readonly priorityRepository: Repository<PriorityEntity>,
    private readonly siteService: SiteService,
    private readonly userService: UsersService,
    private readonly firebaseService: FirebaseService,
  ) {}

  findSiteActivePriorities = async (siteId: number) => {
    try {
      return await this.priorityRepository.findBy({
        siteId: siteId,
        status: stringConstants.A,
        deletedAt: IsNull(),
      });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };
  findSitePriorities = async (siteId: number) => {
    try {
      return await this.priorityRepository.findBy({ siteId: siteId });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  create = async (createPriorityDTO: CreatePriorityDTO) => {
    try {
      const foundSite = await this.siteService.findById(
        createPriorityDTO.siteId,
      );

      if (!foundSite) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.COMPANY);
      }
      assertActiveCatalogSite(foundSite);

      const existingPriority = await this.priorityRepository.findOne({
        where: {
          siteId: createPriorityDTO.siteId,
          priorityCode: createPriorityDTO.priorityCode,
          deletedAt: IsNull()
        }
      });

      if (existingPriority) {
        throw new ValidationException(
          ValidationExceptionType.DUPLICATED_PRIORITY,
          createPriorityDTO.priorityCode
        );
      }

      createPriorityDTO.siteCode = foundSite.siteCode;
      createPriorityDTO.createdAt = new Date();

      const savedPriority = await this.priorityRepository.save(
        createPriorityDTO,
      );
      await this.notifyCatalogChange(createPriorityDTO.siteId);
      return savedPriority;
    } catch (exception) {
      if (exception.code === 'ER_DUP_ENTRY') {
        throw new ValidationException(
          ValidationExceptionType.DUPLICATED_PRIORITY,
          createPriorityDTO.priorityCode
        );
      }
      HandleException.exception(exception);
    }
  };

  update = async (updatepriorityDTO: UpdatePriorityDTO) => {
    try {
      const foundPriority = await this.priorityRepository.findOne({
        where: { id: updatepriorityDTO.id },
      });

      if (!foundPriority) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.PRIORITY);
      }

      const existingPriority = await this.priorityRepository.findOne({
        where: {
          siteId: foundPriority.siteId,
          priorityCode: updatepriorityDTO.priorityCode,
          id: Not(updatepriorityDTO.id),
          deletedAt: IsNull(),
        },
      });

      if (existingPriority) {
        throw new ValidationException(
          ValidationExceptionType.DUPLICATED_PRIORITY,
          updatepriorityDTO.priorityCode,
        );
      }

      foundPriority.priorityCode = updatepriorityDTO.priorityCode;
      foundPriority.priorityDescription = updatepriorityDTO.priorityDescription;
      foundPriority.priorityDays = updatepriorityDTO.priorityDays;
      applyCatalogLifecycle(foundPriority, updatepriorityDTO.status);

      const savedPriority = await this.priorityRepository.save(foundPriority);
      await this.notifyCatalogChange(foundPriority.siteId);
      return savedPriority;
    } catch (exception) {
      if (exception.code === 'ER_DUP_ENTRY') {
        throw new ValidationException(
          ValidationExceptionType.DUPLICATED_PRIORITY,
          updatepriorityDTO.priorityCode
        );
      }
      HandleException.exception(exception);
    }
  };
  findById = async (id: number) => {
    try {
      const priorityExist = await this.priorityRepository.existsBy({ id: id });
      if (!priorityExist) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.PRIORITY);
      }

      return await this.priorityRepository.findOneBy({ id: id });
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
        `Priority ${siteId} was saved but catalog notification failed`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
