import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CardEntity } from './entities/card.entity';
import { In, Not, Repository } from 'typeorm';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';
import { EvidenceEntity } from '../evidence/entities/evidence.entity';
import { CreateCardDTO } from './models/dto/create.card.dto';
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
import {
  ValidationException,
  ValidationExceptionType,
} from 'src/common/exceptions/types/validation.exception';
import { stringConstants } from 'src/utils/string.constant';
import { UpdateDefinitiveSolutionDTO } from './models/dto/update.definitive.solution.dto';
import { CardNoteEntity } from '../cardNotes/card.notes.entity';
import { UpdateProvisionalSolutionDTO } from './models/dto/update.provisional.solution.dto';
import { PriorityEntity } from '../priority/entities/priority.entity';
import { UUID } from 'typeorm/driver/mongodb/bson.typings';
import { FirebaseService } from '../firebase/firebase.service';
import { NotificationDTO } from '../firebase/models/firebase.request.dto';
import { Week } from './models/card.response.dto';
import { QUERY_CONSTANTS } from 'src/utils/query.constants';
import { UpdateCardPriorityDTO } from './models/dto/update.card.priority.dto';
import { UpdateCardMechanicDTO } from './models/dto/upate.card.responsible.dto';
import { addDaysToDate, addDaysToDateString, convertToISOFormat } from 'src/utils/general.functions';
import { UserEntity } from '../users/entities/user.entity';
import { DiscardCardDto } from './models/dto/discard.card.dto';
import { AmDiscardReasonEntity } from '../amDiscardReason/entities/am-discard-reason.entity';

@Injectable()
export class CardService {
  constructor(
    @InjectRepository(CardEntity)
    private readonly cardRepository: Repository<CardEntity>,
    @InjectRepository(EvidenceEntity)
    private readonly evidenceRepository: Repository<EvidenceEntity>,
    @InjectRepository(CardNoteEntity)
    private readonly cardNoteRepository: Repository<CardNoteEntity>,
    private readonly siteService: SiteService,
    private readonly levelService: LevelService,
    private readonly priorityService: PriorityService,
    private readonly cardTypeService: CardTypesService,
    private readonly preclassifierService: PreclassifierService,
    private readonly userService: UsersService,
    private readonly firebaseService: FirebaseService,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(AmDiscardReasonEntity)
    private readonly amDiscardReasonRepository: Repository<AmDiscardReasonEntity>,
  ) {}

  findByLevelMachineId = async (siteId: number, levelMachineId: string) => {
    try {
      const level = await this.levelService.findByLeveleMachineId(
        siteId,
        levelMachineId,
      );

      if (!level) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.LEVELS);
      }

      return await this.cardRepository.findBy({ nodeId: level.id });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findCardByUUID = async (uuid: string) => {
    try {
      const card = await this.cardRepository.findOneBy({ cardUUID: uuid });
      if (card) {
        const cardEvidences = await this.evidenceRepository.findBy({
          cardId: card.id,
        });
        card['levelName'] = card.nodeName;
        card['evidences'] = cardEvidences;
      }
      return card;
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findSiteCards = async (siteId: number) => {
    try {
      const cards = await this.cardRepository.find({
        where: { siteId: siteId },
        order: { siteCardId: 'DESC' },
      });
      if (cards) {
        const allEvidencesMap = await this.findAllEvidences(siteId);

        const cardEvidencesMap = new Map();
        allEvidencesMap.forEach((evidence) => {
          if (!cardEvidencesMap.has(evidence.cardId)) {
            cardEvidencesMap.set(evidence.cardId, []);
          }
          cardEvidencesMap.get(evidence.cardId).push(evidence);
        });

        for (const card of cards) {
          card['levelName'] = card.nodeName;
          card['evidences'] = cardEvidencesMap.get(card.id) || [];
        }
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
        for (const card of cards) {
          card['levelName'] = card.nodeName;
        }
      }
      return cards;
    } catch (exception) {
      HandleException.exception(exception);
    }
  };
  findCardByIDAndGetEvidences = async (cardId: number) => {
    try {
      const card = await this.cardRepository.findOneBy({ id: cardId });
      if (card) {
        card['levelName'] = card.nodeName;
      }
      const evidences = await this.evidenceRepository.findBy({
        cardId: cardId,
      });

      return {
        card,
        evidences,
      };
    } catch (exception) {
      console.log(exception);
      HandleException.exception(exception);
    }
  };

  create = async (createCardDTO: CreateCardDTO) => {
    try {
      let cardUUID = createCardDTO.cardUUID;
      let cardUUIDisNotUnique = await this.cardRepository.exists({
        where: { cardUUID: cardUUID },
      });

      while (cardUUIDisNotUnique) {
        cardUUID = require('crypto').randomUUID();
        cardUUIDisNotUnique = await this.cardRepository.exists({
          where: { cardUUID: cardUUID },
        });
      }

      createCardDTO.cardUUID = cardUUID;

      const site = await this.siteService.findById(createCardDTO.siteId);
      var priority = new PriorityEntity();
      if (createCardDTO.priorityId && createCardDTO.priorityId !== 0) {
        priority = await this.priorityService.findById(
          createCardDTO.priorityId,
        );
      }
      const node = await this.levelService.findById(createCardDTO.nodeId);
      const cardType = await this.cardTypeService.findById(
        createCardDTO.cardTypeId,
      );
      const preclassifier = await this.preclassifierService.findById(
        createCardDTO.preclassifierId,
      );
      const creator = await this.userService.findById(createCardDTO.creatorId);

      if (!site) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.SITE);
      } else if (!node) {
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
      } else if (!creator) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.USER);
      }

      var lastInsertedCard;
      lastInsertedCard = await this.cardRepository.findOne({
        order: { id: 'DESC' },
        where: { siteId: site.id },
      });

      const levelMap = await this.levelService.findAllLevelsBySite(site.id);
      const { area, location } = this.levelService.getSuperiorLevelsById(
        String(node.id),
        levelMap,
      );

      const createdAt = new Date(convertToISOFormat(createCardDTO.cardCreationDate));

      const card = await this.cardRepository.create({
        ...createCardDTO,
        siteCardId: lastInsertedCard ? lastInsertedCard.siteCardId + 1 : 1,
        siteCode: site.siteCode,
        cardTypeColor: cardType.color,
        cardLocation: location,
        areaId: area.id,
        areaName: area.name,
        nodeName: node.name,
        level: node.level,
        superiorId: Number(node.superiorId) === 0 ? node.id : node.superiorId,
        responsableId: node.responsibleId && node.responsibleId,
        responsableName: node.responsibleName && node.responsibleName,
        priorityId: priority.id,
        priorityCode: priority.priorityCode,
        priorityDescription: priority.priorityDescription,
        cardTypeMethodology:
          cardType.cardTypeMethodology === stringConstants.C
            ? cardType.cardTypeMethodology
            : null,
        cardTypeValue:
          cardType.cardTypeMethodology === stringConstants.C
            ? createCardDTO.cardTypeValue
            : null,
        cardTypeMethodologyName: cardType.methodology,
        cardTypeName: cardType.name,
        preclassifierCode: preclassifier.preclassifierCode,
        preclassifierDescription: preclassifier.preclassifierDescription,
        creatorName: creator.name,
        createdAt: createdAt,
        cardCreationDate: convertToISOFormat(createCardDTO.cardCreationDate),
        cardDueDate: priority.id && addDaysToDateString(convertToISOFormat(createCardDTO.cardCreationDate), priority.priorityDays),
        commentsAtCardCreation: createCardDTO.comments,
        appVersion: createCardDTO.appVersion,
        appSo: createCardDTO.appSo,
      });

      await this.cardRepository.save(card);
      lastInsertedCard = await this.cardRepository.find({
        order: { id: 'DESC' },
        take: 1,
      });
      const cardAssignEvidences = lastInsertedCard[0];

      await Promise.all(
        createCardDTO.evidences.map(async (evidence) => {
          switch (evidence.type) {
            case stringConstants.AUCR:
              cardAssignEvidences.evidenceAucr = 1;
              break;
            case stringConstants.VICR:
              cardAssignEvidences.evidenceVicr = 1;
              break;
            case stringConstants.IMCR:
              cardAssignEvidences.evidenceImcr = 1;
              break;
            case stringConstants.AUCL:
              cardAssignEvidences.evidenceAucl = 1;
              break;
            case stringConstants.VICL:
              cardAssignEvidences.evidenceVicl = 1;
              break;
            case stringConstants.IMCL:
              cardAssignEvidences.evidenceImcl = 1;
              break;
            case stringConstants.IMPS:
              cardAssignEvidences.evidenceImps = 1;
              break;
            case stringConstants.AUPS:
              cardAssignEvidences.evidenceAups = 1;
              break;
            case stringConstants.VIPS:
              cardAssignEvidences.evidenceVips = 1;
              break;
          }
          var evidenceToCreate = await this.evidenceRepository.create({
            evidenceName: evidence.url,
            evidenceType: evidence.type,
            cardId: cardAssignEvidences.id,
            siteId: site.id,
            createdAt: createdAt,
          });
          await this.evidenceRepository.save(evidenceToCreate);
        }),
      );

      const tokens =
        await this.userService.getSiteUsersTokensExcludingOwnerUser(
          cardAssignEvidences.siteId,
          cardAssignEvidences.creatorId,
        );
      await this.firebaseService.sendMultipleMessage(
        new NotificationDTO(
          stringConstants.cardsTitle,
          `${stringConstants.cardsDescription} ${cardAssignEvidences.cardTypeMethodologyName}`,
          stringConstants.cardsNotificationType,
        ),
        tokens,
      );

      return await this.cardRepository.save(cardAssignEvidences);
    } catch (exception) {
      console.log(exception);
      HandleException.exception(exception);
    }
  };
  updateDefinitivesolution = async (
    updateDefinitivesolutionDTO: UpdateDefinitiveSolutionDTO,
  ) => {
    try {
      const card = await this.cardRepository.findOneBy({
        id: updateDefinitivesolutionDTO.cardId,
      });

      if (!card) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.CARD);
      }
      if (card.userDefinitiveSolutionId !== null) {
        throw new ValidationException(
          ValidationExceptionType.OVERWRITE_DEFINITIVE_SOLUTION,
        );
      }
      const userDefinitiveSolution = await this.userService.findById(
        updateDefinitivesolutionDTO.userDefinitiveSolutionId,
      );
      const userAppDefinitiveSolution = await this.userService.findById(
        updateDefinitivesolutionDTO.userAppDefinitiveSolutionId,
      );

      if (!userAppDefinitiveSolution || !userDefinitiveSolution) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.USER);
      }

      card.userDefinitiveSolutionId = userDefinitiveSolution.id;
      card.userDefinitiveSolutionName = userDefinitiveSolution.name;
      card.userAppDefinitiveSolutionId = userAppDefinitiveSolution.id;
      card.userAppDefinitiveSolutionName = userAppDefinitiveSolution.name;
      card.cardDefinitiveSolutionDate = new Date();
      card.commentsAtCardDefinitiveSolution =
        updateDefinitivesolutionDTO.comments;
      card.status = stringConstants.R;
      card.updatedAt = new Date();

      await Promise.all(
        updateDefinitivesolutionDTO.evidences.map(async (evidence) => {
          switch (evidence.type) {
            case stringConstants.AUCR:
              card.evidenceAucr = 1;
              break;
            case stringConstants.VICR:
              card.evidenceVicr = 1;
              break;
            case stringConstants.IMCR:
              card.evidenceImcr = 1;
              break;
            case stringConstants.AUCL:
              card.evidenceAucl = 1;
              break;
            case stringConstants.VICL:
              card.evidenceVicl = 1;
              break;
            case stringConstants.IMCL:
              card.evidenceImcl = 1;
              break;
            case stringConstants.IMPS:
              card.evidenceImps = 1;
              break;
            case stringConstants.AUPS:
              card.evidenceAups = 1;
              break;
            case stringConstants.VIPS:
              card.evidenceVips = 1;
              break;
          }
          var evidenceToCreate = await this.evidenceRepository.create({
            evidenceName: evidence.url,
            evidenceType: evidence.type,
            cardId: card.id,
            siteId: card.siteId,
            createdAt: new Date(),
          });
          await this.evidenceRepository.save(evidenceToCreate);
        }),
      );

      await this.cardRepository.save(card);

      const note = await this.cardNoteRepository.create({
        cardId: card.id,
        siteId: card.siteId,
        note: `${stringConstants.noteDefinitiveSoluition} <${card.userAppDefinitiveSolutionId} ${card.userAppDefinitiveSolutionName}> ${stringConstants.aplico} <${card.userDefinitiveSolutionId} ${card.userDefinitiveSolutionName}>`,
        createdAt: new Date(),
      });

      await this.cardNoteRepository.save(note);

      return card;
    } catch (exception) {
      HandleException.exception(exception);
    }
  };
  getCardBySuperiorId = async (superiorId: number, siteId: number) => {
    try {
      const cards = await this.cardRepository.find({
        where: {
          superiorId: superiorId,
          siteId: siteId,
          status: In([stringConstants.A, stringConstants.P, stringConstants.V]),
          deletedAt: null,
        },
      });
      if (cards) {
        for (const card of cards) {
          card['levelName'] = card.nodeName;
        }
      }

      return cards;
    } catch (exception) {
      HandleException.exception(exception);
    }
  };
  updateProvisionalSolution = async (
    updateProvisionalSolutionDTO: UpdateProvisionalSolutionDTO,
  ) => {
    try {
      const card = await this.cardRepository.findOneBy({
        id: updateProvisionalSolutionDTO.cardId,
      });

      if (!card) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.CARD);
      }
      if (card.userProvisionalSolutionId !== null) {
        throw new ValidationException(
          ValidationExceptionType.OVERWRITE_PROVISIONAL_SOLUTION,
        );
      }

      const userProvisionalSolution = await this.userService.findById(
        updateProvisionalSolutionDTO.userProvisionalSolutionId,
      );
      const userAppProvisionalSolution = await this.userService.findById(
        updateProvisionalSolutionDTO.userAppProvisionalSolutionId,
      );

      if (!userProvisionalSolution || !userProvisionalSolution) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.USER);
      }

      card.userProvisionalSolutionId = userProvisionalSolution.id;
      card.userProvisionalSolutionName = userProvisionalSolution.name;
      card.userAppProvisionalSolutionId = userAppProvisionalSolution.id;
      card.userAppProvisionalSolutionName = userAppProvisionalSolution.name;
      card.cardProvisionalSolutionDate = new Date();
      card.commentsAtCardProvisionalSolution =
        updateProvisionalSolutionDTO.comments;
      card.status = stringConstants.P;
      card.updatedAt = new Date();

      await Promise.all(
        updateProvisionalSolutionDTO.evidences.map(async (evidence) => {
          switch (evidence.type) {
            case stringConstants.AUCR:
              card.evidenceAucr = 1;
              break;
            case stringConstants.VICR:
              card.evidenceVicr = 1;
              break;
            case stringConstants.IMCR:
              card.evidenceImcr = 1;
              break;
            case stringConstants.AUCL:
              card.evidenceAucl = 1;
              break;
            case stringConstants.VICL:
              card.evidenceVicl = 1;
              break;
            case stringConstants.IMCL:
              card.evidenceImcl = 1;
              break;
            case stringConstants.IMPS:
              card.evidenceImps = 1;
              break;
            case stringConstants.AUPS:
              card.evidenceAups = 1;
              break;
            case stringConstants.VIPS:
              card.evidenceVips = 1;
              break;
          }
          var evidenceToCreate = await this.evidenceRepository.create({
            evidenceName: evidence.url,
            evidenceType: evidence.type,
            cardId: card.id,
            siteId: card.siteId,
            createdAt: new Date(),
          });
          await this.evidenceRepository.save(evidenceToCreate);
        }),
      );

      await this.cardRepository.save(card);

      const note = await this.cardNoteRepository.create({
        cardId: card.id,
        siteId: card.siteId,
        note: `${stringConstants.noteProvisionalSolution} <${card.userAppProvisionalSolutionId} ${card.userAppProvisionalSolutionName}> ${stringConstants.aplico} <${card.userProvisionalSolutionId} ${card.userProvisionalSolutionName}>`,
        createdAt: new Date(),
      });

      await this.cardNoteRepository.save(note);

      return card;
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findAllEvidences = async (siteId: number) => {
    const evidences = await this.evidenceRepository.find({
      where: { siteId: siteId },
    });
    const evidencesMap = new Map();
    evidences.forEach((level) => evidencesMap.set(level.id, level));
    return evidencesMap;
  };

  findSiteCardsGroupedByPreclassifier = async (
    siteId: number,
    startDate?: string,
    endDate?: string,
  ) => {
    try {
      const queryBuilder = this.cardRepository
        .createQueryBuilder('card')
        .select([QUERY_CONSTANTS.findSiteCardsGroupedByPreclassifier])
        .where('card.site_id = :siteId', { siteId })
        .andWhere('card.status != :statusC AND card.status != :statusR', { statusC: 'C', statusR: 'R' });

      if (startDate && endDate) {
        queryBuilder.andWhere(
          'card.created_at BETWEEN :startDate AND :endDate',
          {
            startDate,
            endDate: `${endDate} 23:59:59`,
          },
        );
      }

      const rawPreclassifiers = await queryBuilder
        .groupBy('preclassifier, methodology, color')
        .getRawMany();

      const preclassifiers = rawPreclassifiers.map((preclassifier) => ({
        ...preclassifier,
        totalCards: Number(preclassifier.totalCards),
      }));

      return preclassifiers;
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findSiteCardsGroupedByMethodology = async (
    siteId: number,
    startDate?: string,
    endDate?: string,
  ) => {
    try {
      const queryBuilder = this.cardRepository
        .createQueryBuilder('card')
        .select([QUERY_CONSTANTS.findSiteCardsGroupedByMethodology])
        .where('card.site_id = :siteId', { siteId })
        .andWhere('card.status != :statusC AND card.status != :statusR', { statusC: 'C', statusR: 'R' });

      if (startDate && endDate) {
        queryBuilder.andWhere(
          'card.created_at BETWEEN :startDate AND :endDate',
          {
            startDate,
            endDate: `${endDate} 23:59:59`,
          },
        );
      }

      const rawMethodologies = await queryBuilder
        .groupBy('methodology, color')
        .getRawMany();

      const methodologies = rawMethodologies.map((methodology) => ({
        ...methodology,
        totalCards: Number(methodology.totalCards),
      }));

      return methodologies;
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findSiteCardsGroupedByArea = async (
    siteId: number,
    startDate?: string,
    endDate?: string,
  ) => {
    try {
              const queryBuilder = this.cardRepository
          .createQueryBuilder('card')
          .select([QUERY_CONSTANTS.findSiteCardsGroupedByArea])
          .where('card.site_id = :siteId', { siteId });

      if (startDate && endDate) {
        queryBuilder.andWhere(
          'card.created_at BETWEEN :startDate AND :endDate',
          {
            startDate,
            endDate: `${endDate} 23:59:59`,
          },
        );
      }

      const result = await queryBuilder
        .groupBy('cardTypeName, area')
        .getRawMany();

      return result;
    } catch (exception) {
      HandleException.exception(exception);
    }
  };
  findSiteCardsGroupedByAreaMore = async (
    siteId: number,
    startDate?: string,
    endDate?: string,
  ) => {
    try {
      const queryBuilder = this.cardRepository
        .createQueryBuilder('card')
        .select([QUERY_CONSTANTS.findSiteCardsGroupedByAreaMore])
        .where('card.site_id = :siteId', { siteId })
        .andWhere('card.status != :statusC AND card.status != :statusR', { statusC: 'C', statusR: 'R' });
      
      if (startDate && endDate) {
        queryBuilder.andWhere(
          'card.created_at BETWEEN :startDate AND :endDate',
          {
            startDate,
            endDate: `${endDate} 23:59:59`,
          },
        );
      }
      
      const result = await queryBuilder
        .groupBy('cardTypeName, area, areaId')
        .getRawMany();
      
      return result;
    } catch (exception) {
      HandleException.exception(exception);
    }
  };
  findSiteCardsGroupedByMachine = async (
    siteId: number,
    startDate?: string,
    endDate?: string,
  ) => {
    try {
      // Obtener todas las tarjetas con los filtros aplicados
      const queryBuilder = this.cardRepository
        .createQueryBuilder('card')
        .where('card.site_id = :siteId', { siteId })
        .andWhere('card.status != :statusC AND card.status != :statusR', { statusC: 'C', statusR: 'R' });

      if (startDate && endDate) {
        queryBuilder.andWhere(
          'card.created_at BETWEEN :startDate AND :endDate',
          {
            startDate,
            endDate: `${endDate} 23:59:59`,
          },
        );
      }

      const cards = await queryBuilder
        .orderBy('card.siteCardId', 'DESC')
        .getMany();

      if (!cards.length) {
        return { categories: [], series: [] };
      }

      // Get all evidences for all cards
      const allEvidencesMap = await this.findAllEvidences(siteId);
      const cardEvidencesMap = new Map();
      allEvidencesMap.forEach((evidence) => {
        if (!cardEvidencesMap.has(evidence.cardId)) {
          cardEvidencesMap.set(evidence.cardId, []);
        }
        cardEvidencesMap.get(evidence.cardId).push(evidence);
      });

      // Group cards by responsible and type with status
      const groupedData = new Map<string, Map<string, { onTime: any[], overdue: any[] }>>();
      
      cards.forEach((card) => {
        const responsibleKey = card.responsableName || 'Sin asignar'; // Categories = responsables
        const cardTypeKey = card.cardTypeName; // Para las series
        
        if (!groupedData.has(responsibleKey)) {
          groupedData.set(responsibleKey, new Map());
        }
        
        if (!groupedData.get(responsibleKey).has(cardTypeKey)) {
          groupedData.get(responsibleKey).set(cardTypeKey, { onTime: [], overdue: [] });
        }
        
        // Add necessary data for the drawer
        const cardWithDetails = {
          id: card.id,
          siteCardId: card.siteCardId,
          cardUUID: card.cardUUID,
          cardCreationDate: card.cardCreationDate,
          cardDueDate: card.cardDueDate,
          cardLocation: card.cardLocation,
          areaName: card.areaName,
          creatorName: card.creatorName,
          cardTypeMethodologyName: card.cardTypeMethodologyName,
          mechanicName: card.mechanicName,
          status: card.status,
          nodeName: card.nodeName,
          levelName: card.nodeName,
          evidences: cardEvidencesMap.get(card.id) || [],
          priorityCode: card.priorityCode,
          priorityDescription: card.priorityDescription,
          createdAt: card.createdAt,
          updatedAt: card.updatedAt,
          commentsAtCardCreation: card.commentsAtCardCreation,
          commentsAtCardProvisionalSolution: card.commentsAtCardProvisionalSolution,
          commentsAtCardDefinitiveSolution: card.commentsAtCardDefinitiveSolution,
          responsableName: card.responsableName,
          preclassifierCode: card.preclassifierCode,
          preclassifierDescription: card.preclassifierDescription
        };
        
        // Determine if it is on time or overdue
        const isOnTime = new Date(card.cardDueDate) >= new Date();
        
        if (isOnTime) {
          groupedData.get(responsibleKey).get(cardTypeKey).onTime.push(cardWithDetails);
        } else {
          groupedData.get(responsibleKey).get(cardTypeKey).overdue.push(cardWithDetails);
        }
      });

      // Build categories (unique responsible)
      const categories = Array.from(groupedData.keys()).sort();

      // Build series (card types with status)
      const seriesMap = new Map<string, { name: string; data: any[] }>();
      
      // Get all unique card types
      const cardTypes = new Set<string>();
      groupedData.forEach((cardTypeMap) => {
        cardTypeMap.forEach((_, cardType) => {
          cardTypes.add(cardType);
        });
      });

      // Create series for each card type with status
      cardTypes.forEach((cardType) => {
        // Series "On time"
        const onTimeSeriesData = categories.map((category) => {
          const cardsForCategory = groupedData.get(category)?.get(cardType)?.onTime || [];
          return {
            count: cardsForCategory.length,
            cards: cardsForCategory
          };
        });

        // Series "Overdue"
        const overdueSeriesData = categories.map((category) => {
          const cardsForCategory = groupedData.get(category)?.get(cardType)?.overdue || [];
          return {
            count: cardsForCategory.length,
            cards: cardsForCategory
          };
        });

        // Only add series that have at least one card
        if (onTimeSeriesData.some(data => data.count > 0)) {
          seriesMap.set(`${cardType} - En tiempo`, {
            name: `${cardType} - En tiempo`,
            data: onTimeSeriesData
          });
        }

        if (overdueSeriesData.some(data => data.count > 0)) {
          seriesMap.set(`${cardType} - Vencidas`, {
            name: `${cardType} - Vencidas`,
            data: overdueSeriesData
          });
        }
      });

      const series = Array.from(seriesMap.values());

      return { categories, series };
    } catch (exception) {
      HandleException.exception(exception);
    }
  };
  public findAreaCardsGroupedByMachine = async (
    siteId: number,
    areaId: number,
    startDate?: string,
    endDate?: string,
  ) => {
    try {
      const useStartDate = startDate || null;
      const useEndDate = endDate || null;
      const result = await this.cardRepository.query(
        'CALL findAreaCardsGroupedByMachine(?, ?, ?, ?)',
        [siteId, areaId, useStartDate, useEndDate],
      );
      return result[0];
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findSiteCardsGroupedByCreator = async (
    siteId: number,
    startDate?: string,
    endDate?: string,
  ) => {
    try {
      const queryBuilder = this.cardRepository
        .createQueryBuilder('card')
        .select([QUERY_CONSTANTS.findSiteCardsGroupedByCreator])
        .where('card.site_id = :siteId', { siteId })
        .andWhere('card.status != :statusC AND card.status != :statusR', { statusC: 'C', statusR: 'R' });

      if (startDate && endDate) {
        queryBuilder.andWhere(
          'card.created_at BETWEEN :startDate AND :endDate',
          {
            startDate,
            endDate: `${endDate} 23:59:59`,
          },
        );
      }

      const result = await queryBuilder
        .groupBy('creator, cardTypeName')
        .getRawMany();

      return result;
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findSiteCardsGroupedByMechanic = async (
    siteId: number,
    startDate?: string,
    endDate?: string,
  ) => {
    try {
      // Get all cards with the applied filters
      const queryBuilder = this.cardRepository
        .createQueryBuilder('card')
        .where('card.site_id = :siteId', { siteId })
        .andWhere('card.status != :statusC AND card.status != :statusR', { statusC: 'C', statusR: 'R' });

      if (startDate && endDate) {
        queryBuilder.andWhere(
          'card.created_at BETWEEN :startDate AND :endDate',
          {
            startDate,
            endDate: `${endDate} 23:59:59`,
          },
        );
      }

      const cards = await queryBuilder
        .orderBy('card.siteCardId', 'DESC')
        .getMany();

      if (!cards.length) {
        return { categories: [], series: [] };
      }

      // Get all evidences for all cards
      const allEvidencesMap = await this.findAllEvidences(siteId);
      const cardEvidencesMap = new Map();
      allEvidencesMap.forEach((evidence) => {
        if (!cardEvidencesMap.has(evidence.cardId)) {
          cardEvidencesMap.set(evidence.cardId, []);
        }
        cardEvidencesMap.get(evidence.cardId).push(evidence);
      });

      // Group cards by mechanic and type with status
      const groupedData = new Map<string, Map<string, { onTime: any[], overdue: any[] }>>();
      
      cards.forEach((card) => {
        const mechanicKey = card.mechanicName || 'Without mechanic'; // Categories = mechanics
        const cardTypeKey = card.cardTypeName; // for series
        
        if (!groupedData.has(mechanicKey)) {
          groupedData.set(mechanicKey, new Map());
        }
        
        if (!groupedData.get(mechanicKey).has(cardTypeKey)) {
          groupedData.get(mechanicKey).set(cardTypeKey, { onTime: [], overdue: [] });
        }
        
        // Add necessary data for the drawer
        const cardWithDetails = {
          id: card.id,
          siteCardId: card.siteCardId,
          cardUUID: card.cardUUID,
          cardCreationDate: card.cardCreationDate,
          cardDueDate: card.cardDueDate,
          cardLocation: card.cardLocation,
          areaName: card.areaName,
          creatorName: card.creatorName,
          cardTypeMethodologyName: card.cardTypeMethodologyName,
          mechanicName: card.mechanicName,
          status: card.status,
          nodeName: card.nodeName,
          levelName: card.nodeName,
          evidences: cardEvidencesMap.get(card.id) || [],
          priorityCode: card.priorityCode,
          priorityDescription: card.priorityDescription,
          createdAt: card.createdAt,
          updatedAt: card.updatedAt,
          commentsAtCardCreation: card.commentsAtCardCreation,
          commentsAtCardProvisionalSolution: card.commentsAtCardProvisionalSolution,
          commentsAtCardDefinitiveSolution: card.commentsAtCardDefinitiveSolution,
          responsableName: card.responsableName,
          preclassifierCode: card.preclassifierCode,
          preclassifierDescription: card.preclassifierDescription
        };
        
        // Determine if it is on time or overdue
        const isOnTime = new Date(card.cardDueDate) >= new Date();
        
        if (isOnTime) {
          groupedData.get(mechanicKey).get(cardTypeKey).onTime.push(cardWithDetails);
        } else {
          groupedData.get(mechanicKey).get(cardTypeKey).overdue.push(cardWithDetails);
        }
      });

      // Build categories (unique mechanics)
      const categories = Array.from(groupedData.keys()).sort();

      // Build series (card types with status)
      const seriesMap = new Map<string, { name: string; data: any[] }>();
      
      // Get all unique card types
      const cardTypes = new Set<string>();
      groupedData.forEach((cardTypeMap) => {
        cardTypeMap.forEach((_, cardType) => {
          cardTypes.add(cardType);
        });
      });

      // Create series for each card type with status
      cardTypes.forEach((cardType) => {
        // Series "On time"
        const onTimeSeriesData = categories.map((category) => {
          const cardsForCategory = groupedData.get(category)?.get(cardType)?.onTime || [];
          return {
            count: cardsForCategory.length,
            cards: cardsForCategory
          };
        });

        // Series "Overdue"
        const overdueSeriesData = categories.map((category) => {
          const cardsForCategory = groupedData.get(category)?.get(cardType)?.overdue || [];
          return {
            count: cardsForCategory.length,
            cards: cardsForCategory
          };
        });

        // Only add series that have at least one card
        if (onTimeSeriesData.some(data => data.count > 0)) {
          seriesMap.set(`${cardType} - En tiempo`, {
            name: `${cardType} - En tiempo`,
            data: onTimeSeriesData
          });
        }

        if (overdueSeriesData.some(data => data.count > 0)) {
          seriesMap.set(`${cardType} - Vencidas`, {
            name: `${cardType} - Vencidas`,
            data: overdueSeriesData
          });
        }
      });

      const series = Array.from(seriesMap.values());

      return { categories, series };
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findSiteCardsGroupedByDefinitiveUser = async (
    siteId: number,
    startDate?: string,
    endDate?: string,
  ) => {
    try {
      const queryBuilder = this.cardRepository
        .createQueryBuilder('card')
        .select([QUERY_CONSTANTS.findSiteCardsGroupedByDefinitiveUser])
        .where('card.site_id = :siteId', { siteId })
        .andWhere('(card.status = :statusC OR card.status = :statusR)', { statusC: 'C', statusR: 'R' });

      if (startDate && endDate) {
        queryBuilder.andWhere(
          'card.created_at BETWEEN :startDate AND :endDate',
          {
            startDate,
            endDate: `${endDate} 23:59:59`,
          },
        );
      }

      const result = queryBuilder
        .groupBy('cardTypeName, definitiveUser')
        .getRawMany();

      return result;
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findSiteCardsGroupedByWeeks = async (siteId: number) => {
    try {
      const rawWeeks = await this.cardRepository
        .createQueryBuilder('card')
        .select([QUERY_CONSTANTS.findSiteCardsGroupedByWeeks])
        .where('card.site_id = :siteId', { siteId })
        .andWhere('card.status != :statusC', { statusC: 'C' })
        .groupBy('year')
        .addGroupBy('week')
        .orderBy('year, week')
        .getRawMany();

      const weeks = rawWeeks.reduce<Week[]>((acc, week, index) => {
        const previousWeek = acc[index - 1] || {
          cumulativeIssued: 0,
          cumulativeEradicated: 0,
        };

        const currentWeek: Week = {
          ...week,
          issued: Number(week.issued),
          cumulativeIssued: previousWeek.cumulativeIssued + Number(week.issued),
          eradicated: Number(week.eradicated),
          cumulativeEradicated:
            previousWeek.cumulativeEradicated + Number(week.eradicated),
        };

        acc.push(currentWeek);
        return acc;
      }, []);

      return weeks;
    } catch (exception) {
      console.log(exception);
      HandleException.exception(exception);
    }
  };

  updateCardPriority = async (updateCardPriorityDTO: UpdateCardPriorityDTO) => {
    try {
      const card = await this.cardRepository.findOne({
        where: { id: updateCardPriorityDTO.cardId },
      });
      if (!card) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.CARD);
      }

      if (Number(card.priorityId) === updateCardPriorityDTO.priorityId) {
        return;
      }

      const priority = await this.priorityService.findById(
        updateCardPriorityDTO.priorityId,
      );

      if (!priority) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.PRIORITY);
      }

      const user = await this.userService.findOneById(
        updateCardPriorityDTO.idOfUpdatedBy,
      );

      if (!user) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.USER);
      }

      const note = new CardNoteEntity();
      note.cardId = card.id;
      note.siteId = card.siteId;
      note.note = `${stringConstants.cambio} <${user.id} ${user.name}> ${stringConstants.cambioLaPrioridadDe} <${card.priorityCode} - ${card.priorityDescription}> ${stringConstants.a} <${priority.priorityCode} - ${priority.priorityDescription}>`;
      note.createdAt = new Date();

      card.priorityId = priority.id;
      card.priorityCode = priority.priorityCode;
      card.priorityDescription = priority.priorityDescription;
      card.cardDueDate = addDaysToDate(card.createdAt, priority.priorityDays);

      await this.cardRepository.save(card);

      return await this.cardNoteRepository.save(note);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  updateCardMechanic = async (updateCardMechanicDTO: UpdateCardMechanicDTO) => {
    try {
      const card = await this.cardRepository.findOne({
        where: { id: updateCardMechanicDTO.cardId },
      });
      if (!card) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.CARD);
      }

      const currentMechanicId = card.mechanicId ? String(card.mechanicId) : null;
      const newMechanicId = updateCardMechanicDTO.mechanicId ? String(updateCardMechanicDTO.mechanicId) : null;
      
      if (currentMechanicId === newMechanicId) {
        return;
      }

      const userMechanic = await this.userService.findOneById(
        updateCardMechanicDTO.mechanicId,
      );

      const user = await this.userService.findOneById(
        updateCardMechanicDTO.idOfUpdatedBy,
      );

      if (!userMechanic || !user) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.USER);
      }

      const oldMechanicName = card.mechanicName || stringConstants.noResponsible;

      card.mechanicId = userMechanic.id;
      card.mechanicName = userMechanic.name;

      await this.cardRepository.save(card);

      const note = new CardNoteEntity();
      note.cardId = card.id;
      note.siteId = card.siteId;
      note.note = `${stringConstants.cambio} <${user.id} ${user.name}> ${stringConstants.cambioElMecanicoDe} <${oldMechanicName}> ${stringConstants.a} <${userMechanic.name}>`;
      note.createdAt = new Date();

      const tokens = await this.userService.getUserToken(userMechanic.id);
      if (tokens && tokens.length > 0) {
        await this.firebaseService.sendMultipleMessage(
          new NotificationDTO(
            stringConstants.cardAssignedTitle.replace(
              '[card_id]',
              card.siteCardId.toString(),
            ),
            stringConstants.cardAssignedDescription,
            stringConstants.emptyNotificationType,
          ),
          tokens,
        );
      }

      return await this.cardNoteRepository.save(note);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findCardNotes = async (cardId: number) => {
    try {
      return await this.cardNoteRepository.find({
        where: { cardId: cardId },
        order: { createdAt: 'DESC' },
      });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findCardNotesByUUID = async (cardUUID: string) => {
    try {
      const card = await this.cardRepository.findOne({
        where: { cardUUID: cardUUID }
      });

      if (!card) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.CARD);
      }

      return await this.cardNoteRepository.find({
        where: { cardId: card.id },
        order: { createdAt: 'DESC' },
      });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  getCards = async (params: {
    siteId: number;
    area?: string;
    nodeName?: string;
    preclassifier?: string;
    mechanic?: string;
    creator?: string;
    definitiveUser?: string;
    cardTypeName: string;
  }) => {
    const {
      siteId,
      area,
      nodeName,
      mechanic,
      creator,
      definitiveUser,
      cardTypeName,
      preclassifier,
    } = params;

    const queryBuilder = this.cardRepository
      .createQueryBuilder('card')
      .where('card.siteId = :siteId', { siteId })
      .andWhere('card.cardTypeName = :cardTypeName', { cardTypeName });

    switch (true) {
      case !!area:
        queryBuilder.andWhere('card.areaName = :area', { area });
        break;
      case !!mechanic:
        if (mechanic === stringConstants.none) {
          queryBuilder.andWhere('card.mechanicName IS NULL');
        } else {
          queryBuilder.andWhere('card.mechanicName = :mechanic', { mechanic });
        }
        break;
      case !!creator:
        queryBuilder.andWhere('card.creatorName = :creator', { creator });
        break;
      case !!definitiveUser:
        if (definitiveUser === stringConstants.none) {
          queryBuilder.andWhere('card.userDefinitiveSolutionName IS NULL');
        } else {
          queryBuilder.andWhere(
            'card.userDefinitiveSolutionName = :definitiveUser',
            { definitiveUser },
          );
        }
        break;
      case !!nodeName:
        queryBuilder.andWhere('card.nodeName = :nodeName', { nodeName });
        break;
      default:
        break;
    }

    if (preclassifier) {
      queryBuilder.andWhere(
        "CONCAT(card.preclassifier_code, ' ', card.preclassifier_description) LIKE :preclassifier",
        { preclassifier: `%${preclassifier}%` },
      );
    }

    if (preclassifier) {
      queryBuilder.andWhere(
        "CONCAT(card.preclassifier_code, ' ', card.preclassifier_description) LIKE :preclassifier",
        { preclassifier: `%${preclassifier}%` },
      );
    }

    queryBuilder.orderBy('card.siteCardId', 'DESC');

    const cards = await queryBuilder.getMany();

    if (cards) {
      const allEvidencesMap = await this.findAllEvidences(siteId);

      const cardEvidencesMap = new Map();
      allEvidencesMap.forEach((evidence) => {
        if (!cardEvidencesMap.has(evidence.cardId)) {
          cardEvidencesMap.set(evidence.cardId, []);
        }
        cardEvidencesMap.get(evidence.cardId).push(evidence);
      });

      for (const card of cards) {
        card['evidences'] = cardEvidencesMap.get(card.id) || [];
      }
    }
    return cards;
  };

  findbySiteId = async (siteId: number) => {
    try {
      return await this.cardRepository.find({ where: { siteId: siteId } });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  async getCardsByLevelId(siteId: number, levelId: number) {
    const cards = await this.cardRepository
      .createQueryBuilder('card')
      .where('card.siteId = :siteId', { siteId })
      .andWhere('card.nodeId = :levelId', { levelId })
      .andWhere('card.deletedAt IS NULL')
      .andWhere('card.status != :statusC AND card.status != :statusR', {
        statusC: 'C',
        statusR: 'R',
      })
      .orderBy('card.siteCardId', 'DESC')
      .getMany();
    return cards;
  }

  findUserCards = async (userId: number) => {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
        relations: ['userHasSites', 'userHasSites.site']
      });

      if (!user || !user.userHasSites || user.userHasSites.length === 0) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.USER);
      }

      const userSite = user.userHasSites[0].site;

      const cards = await this.cardRepository.find({
        where: { 
          siteId: userSite.id,
          mechanicId: userId
        },
        order: { siteCardId: 'DESC' }
      });

      if (cards) {
        const allEvidencesMap = await this.findAllEvidences(userSite.id);

        const cardEvidencesMap = new Map();
        allEvidencesMap.forEach((evidence) => {
          if (!cardEvidencesMap.has(evidence.cardId)) {
            cardEvidencesMap.set(evidence.cardId, []);
          }
          cardEvidencesMap.get(evidence.cardId).push(evidence);
        });

        for (const card of cards) {
          card['levelName'] = card.nodeName;
          card['evidences'] = cardEvidencesMap.get(card.id) || [];
        }
      }
      return cards;
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  async discardCard(dto: DiscardCardDto) {
    try {
      const card = await this.cardRepository.findOne({
        where: { id: dto.cardId },
      });

      if (!card) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.CARD);
      }

      const discardReason = await this.amDiscardReasonRepository.findOne({
        where: { id: dto.amDiscardReasonId, siteId: card.siteId },
      });

      if (!discardReason) {
        throw new NotFoundCustomException(
          NotFoundCustomExceptionType.AM_DISCARD_REASON,
        );
      }

      card.status = stringConstants.DISCARDED;
      card.amDiscardReasonId = dto.amDiscardReasonId;
      card.discardReason = dto.discardReason;
      card.managerId = dto.managerId || null;
      card.managerName = dto.managerName || null;
      card.cardManagerCloseDate = dto.cardManagerCloseDate || null;
      card.commentsManagerAtCardClose = dto.commentsManagerAtCardClose || null;
      card.updatedAt = new Date();

      return await this.cardRepository.save(card);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findSiteDiscardedCardsGroupedByUser = async (
    siteId: number,
    startDate?: string,
    endDate?: string,
  ) => {
    try {
      const queryBuilder = this.cardRepository
        .createQueryBuilder('card')
        .select(QUERY_CONSTANTS.findSiteDiscardedCardsGroupedByCreator)
        .leftJoin(
          'am_discard_reasons',
          'adr',
          'adr.id = card.am_discard_reason_id',
        )
        .where('card.site_id = :siteId', { siteId })
        .andWhere('card.status = :status', {
          status: stringConstants.CANCELLED,
        });

      if (startDate && endDate) {
        queryBuilder.andWhere(
          'card.created_at BETWEEN :startDate AND :endDate',
          {
            startDate,
            endDate: `${endDate} 23:59:59`,
          },
        );
      }

      const result = await queryBuilder
        .groupBy('creatorName, discardReason, cardTypeName')
        .getRawMany();

      return result;
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findCardsByFastPassword = async (siteId: number, fastPassword: string) => {
    try {
      const user = await this.userRepository.findOne({
        where: { 
          fastPassword: fastPassword,
          siteId: siteId,
          status: 'A'
        }
      });

      if (!user) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.USER);
      }
      const cards = await this.cardRepository.find({
        where: [
          { 
            siteId: siteId,
            mechanicId: user.id
          },
          {
            siteId: siteId,
            responsableId: user.id
          }
        ],
        order: { siteCardId: 'DESC' }
      });

      if (cards && cards.length > 0) {
        const allEvidencesMap = await this.findAllEvidences(siteId);

        const cardEvidencesMap = new Map();
        allEvidencesMap.forEach((evidence) => {
          if (!cardEvidencesMap.has(evidence.cardId)) {
            cardEvidencesMap.set(evidence.cardId, []);
          }
          cardEvidencesMap.get(evidence.cardId).push(evidence);
        });

        for (const card of cards) {
          card['levelName'] = card.nodeName;
          card['evidences'] = cardEvidencesMap.get(card.id) || [];
        }
      }

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          fastPassword: user.fastPassword
        },
        cards: cards || []
      };
    } catch (exception) {
      HandleException.exception(exception);
    }
  };
}
