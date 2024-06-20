import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CardEntity } from './entities/card.entity';
import { Repository } from 'typeorm';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';
import { EvidenceEntity } from '../evidence/entities/evidence.entity';
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
import { LevelService } from '../level/level.service';
import { ValidationException, ValidationExceptionType } from 'src/common/exceptions/types/validation.exception';

@Injectable()
export class CardService {
  constructor(
    @InjectRepository(CardEntity)
    private readonly cardRepository: Repository<CardEntity>,
    @InjectRepository(EvidenceEntity)
    private readonly evidenceRepository: Repository<EvidenceEntity>,
    private readonly siteService: SiteService,
    private readonly levelService: LevelService,
    private readonly priorityService: PriorityService,
    private readonly cardTypeService: CardTypesService,
    private readonly preclassifierService: PreclassifierService,
    private readonly userService: UsersService,
  ) {}

  findSiteCards = async (siteId: number) => {
    try {
      const cards = await this.cardRepository.findBy({ siteId: siteId });
      if (cards) {
        cards.forEach((card) => {
          card['levelName'] = card.areaName;
        });
      }
      return cards;
    } catch (exception) {
      HandleException.exception(exception);
    }
  };
  findResponsibleCards = async (responsibleId: number) => {
    try {
      const cards = await this.cardRepository.findBy({
        responsableId: responsibleId,
      });
      if (cards) {
        cards.forEach((card) => {
          card['levelName'] = card.areaName;
        });
      }
      return cards;
    } catch (exception) {
      HandleException.exception(exception);
    }
  };
  findCardByIDAndGetEvidences = async (cardId: number) => {
    try {
      const card = await this.cardRepository.findOneBy({ id: cardId });
      if (card) card['levelName'] = card.areaName;
      const evidences = await this.evidenceRepository.findBy({
        cardId: cardId,
      });

      return {
        card,
        evidences,
      };
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  create = async (createCardDTO: CreateCardDTO) => {
    try {
      const cardUUIDisNotUnique = await this.cardRepository.exists({where: {cardUUID: createCardDTO.cardUUID}})

      if(cardUUIDisNotUnique){
        throw new ValidationException(ValidationExceptionType.DUPLICATE_CARD_UUID)
      }

      const site = await this.siteService.findById(createCardDTO.siteId);
      const priority = await this.priorityService.findById(
        createCardDTO.priorityId,
      );
      const area = await this.levelService.findById(createCardDTO.areaId);
      const cardType = await this.cardTypeService.findById(
        createCardDTO.cardTypeId,
      );
      const preclassifier = await this.preclassifierService.findById(
        createCardDTO.preclassifierId,
      );
      const creator = await this.userService.findById(createCardDTO.creatorId);
      const responsible = await this.userService.findById(
        createCardDTO.responsableId,
      );

      if (!site) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.SITE);
      } else if (!area) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.LEVELS);
      } else if (!priority) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.PRIORITY);
      } else if (!cardType) {
        throw new NotFoundCustomException(
          NotFoundCustomExceptionType.CARDTYPES,
        );
      } else if (!preclassifier) {
        throw new NotFoundCustomException(
          NotFoundCustomExceptionType.PRECLASSIFIER,
        );
      } else if (!creator || !responsible) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.USER);
      }

      if (createCardDTO.mechanicId) {
        const mechanic = await this.userService.findById(
          createCardDTO.mechanicId,
        );
        if (!mechanic)
          throw new NotFoundCustomException(NotFoundCustomExceptionType.USER);
        createCardDTO.mechanicName = mechanic.name;
      }

      if (createCardDTO.userProvisionalSolutionId) {
        const userProvisionalSolution = await this.userService.findById(
          createCardDTO.userProvisionalSolutionId,
        );
        if (!userProvisionalSolution)
          throw new NotFoundCustomException(NotFoundCustomExceptionType.USER);
        createCardDTO.userProvisionalSolutionName =
          userProvisionalSolution.name;
      }

      if (createCardDTO.userAppProvisionalSolutionId) {
        const userAppProvisionalSolution = await this.userService.findById(
          createCardDTO.userAppProvisionalSolutionId,
        );
        if (!userAppProvisionalSolution)
          throw new NotFoundCustomException(NotFoundCustomExceptionType.USER);
        createCardDTO.userAppProvisionalSolutionName =
          userAppProvisionalSolution.name;
      }

      if (createCardDTO.userDefinitiveSolutionId) {
        const userDefinitiveSolution = await this.userService.findById(
          createCardDTO.userDefinitiveSolutionId,
        );
        if (!userDefinitiveSolution)
          throw new NotFoundCustomException(NotFoundCustomExceptionType.USER);
        createCardDTO.userDefinitiveSolutionName = userDefinitiveSolution.name;
      }

      if (createCardDTO.userAppDefinitiveSolutionId) {
        const userAppDefinitiveSolution = await this.userService.findById(
          createCardDTO.userAppDefinitiveSolutionId,
        );
        if (!userAppDefinitiveSolution)
          throw new NotFoundCustomException(NotFoundCustomExceptionType.USER);
        createCardDTO.userAppDefinitiveSolutionName =
          userAppDefinitiveSolution.name;
      }

      if (createCardDTO.managerId) {
        const manager = await this.userService.findById(
          createCardDTO.managerId,
        );
        if (!manager)
          throw new NotFoundCustomException(NotFoundCustomExceptionType.USER);
        createCardDTO.managerName = manager.name;
      }

      const lastInsertedCard = await this.cardRepository.find({order: {id: 'DESC'}, take: 1})
      const {siteCardId} = lastInsertedCard[0]
      createCardDTO.siteCardId = siteCardId+1
      createCardDTO.siteCode = site.siteCode
      createCardDTO.cardTypeColor = cardType.color
      createCardDTO.areaName = area.name
      createCardDTO.level = area.level
      createCardDTO.superiorId = Number(area.superiorId) === 0 ? area.id: area.superiorId
      createCardDTO.priorityCode = priority.priorityCode
      createCardDTO.priorityDescription = priority.priorityDescription
      createCardDTO.cardTypeMethodology = cardType.cardTypeMethodology
      createCardDTO.cardTypeMethodologyName = cardType.methodology
      createCardDTO.cardTypeName = cardType.name
      createCardDTO.preclassifierCode = preclassifier.preclassifierCode
      createCardDTO.preclassifierDescription = preclassifier.preclassifierDescription
      createCardDTO.creatorName = creator.name
      createCardDTO.responsableName = responsible.name
      createCardDTO.createdAt = new Date()
      createCardDTO.cardDueDate = new Date()

     return await this.cardRepository.save(createCardDTO)

    } catch (exception) {
      console.log(exception)
      HandleException.exception(exception);
    }
  };
}
