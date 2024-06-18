import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CardEntity } from './entities/card.entity';
import { Repository } from 'typeorm';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';
import { CreateCardDTO } from './models/dto/create-card.dto';
import { SiteService } from '../site/site.service';
import {
  NotFoundCustomException,
  NotFoundCustomExceptionType,
} from 'src/common/exceptions/types/notFound.exception';
import { PriorityService } from '../priority/priority.service';
import { CardTypesService } from '../cardTypes/cardTypes.service';
import { PreclassifierService } from '../preclassifier/preclassifier.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class CardService {
  constructor(
    @InjectRepository(CardEntity)
    private readonly cardRepository: Repository<CardEntity>,
    private readonly siteService: SiteService,
    private readonly priorityService: PriorityService,
    private readonly cardTypeService: CardTypesService,
    private readonly preclassifierService: PreclassifierService,
    private readonly userService: UsersService
  ) {}

  findSiteCards = async (siteId: number) => {
    try {
      return await this.cardRepository.findBy({ siteId: siteId });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };
  findResponsibleCards = async (responsibleId: number) => {
    try {
      return await this.cardRepository.findBy({ responsableId: responsibleId });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };
  create = async (createCardDTO: CreateCardDTO) => {
    try {
      const siteExists = await this.siteService.findById(createCardDTO.siteId);
      const priorityExists = await this.priorityService.findById(createCardDTO.priorityId);
      const cardTypeExists = await this.cardTypeService.findById(createCardDTO.cardTypeId);
      const preclassifierExists = await this.preclassifierService.findById(createCardDTO.preclassifierId)
      const creatorExists = await this.userService.findById(createCardDTO.creatorId)
      const responsibleExists = await this.userService.findById(createCardDTO.responsableId)
      const mechanicExists = createCardDTO.mechanicId ? await this.userService.findById(createCardDTO.mechanicId) : true;
      const userProvisionalSolutionExists = createCardDTO.userProvisionalSolutionId? await this.userService.findById(createCardDTO.userProvisionalSolutionId) : true;
      const userAppProvisionalSolutionExists = createCardDTO.userAppProvisionalSolutionId? await this.userService.findById(createCardDTO.userAppProvisionalSolutionId) : true;
      const userDefinitiveSolutionExists = createCardDTO.userDefinitiveSolutionId? await this.userService.findById(createCardDTO.userDefinitiveSolutionId) : true;
      const userAppDefinitiveSolutionExists = createCardDTO.userAppDefinitiveSolutionId? await this.userService.findById(createCardDTO.userAppDefinitiveSolutionId) : true;
      const managerExists = createCardDTO.managerId? await this.userService.findById(createCardDTO.managerId) : true;

      const anyUserNotExist = !creatorExists || 
                        !responsibleExists || 
                        !mechanicExists || 
                        !userProvisionalSolutionExists || 
                        !userAppProvisionalSolutionExists || 
                        !userDefinitiveSolutionExists || 
                        !userAppDefinitiveSolutionExists || 
                        !managerExists;

      if (!siteExists) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.SITE);
      } else if (!priorityExists) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.PRIORITY);
      } else if (!cardTypeExists){
        throw new NotFoundCustomException(NotFoundCustomExceptionType.CARDTYPES)
      } else if (!preclassifierExists){
        throw new NotFoundCustomException(NotFoundCustomExceptionType.PRECLASSIFIER)
      } else if (anyUserNotExist){
        throw new NotFoundCustomException(NotFoundCustomExceptionType.USER)
      }

    } catch (exception) {
      HandleException.exception(exception);
    }
  };
}
