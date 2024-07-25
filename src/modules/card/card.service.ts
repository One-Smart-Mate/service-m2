import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CardEntity } from './entities/card.entity';
import { In, Repository } from 'typeorm';
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
  ) {}

  findCardByUUID = async (uuid: string) => {
    try {
      const card = await this.cardRepository.findOneBy({ cardUUID: uuid });
      if (card) {
        const levelMap = await this.levelService.findAllLevels();
        const cardEvidences = await this.evidenceRepository.findBy({
          cardId: card.id,
        });

        card['levelName'] = card.areaName;
        card['levelList'] = this.levelService.findAllSuperiorLevelsById(
          String(card.areaId),
          levelMap,
        );
        card['evidences'] = cardEvidences;
      }
      return card;
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findSiteCards = async (siteId: number) => {
    try {
      const cards = await this.cardRepository.findBy({ siteId: siteId });
      if (cards) {
        const levelMap = await this.levelService.findAllLevels();
        const allEvidencesMap = await this.findAllEvidences();

        const cardEvidencesMap = new Map();
        allEvidencesMap.forEach((evidence) => {
          if (!cardEvidencesMap.has(evidence.cardId)) {
            cardEvidencesMap.set(evidence.cardId, []);
          }
          cardEvidencesMap.get(evidence.cardId).push(evidence);
        });

        for (const card of cards) {
          card['levelName'] = card.areaName;
          card['levelList'] = this.levelService.findAllSuperiorLevelsById(
            String(card.areaId),
            levelMap,
          );
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
        const levelMap = await this.levelService.findAllLevels();
        for (const card of cards) {
          card['levelName'] = card.areaName;
          card['levelList'] = this.levelService.findAllSuperiorLevelsById(
            String(card.areaId),
            levelMap,
          );
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
        const levelMap = await this.levelService.findAllLevels();
        card['levelName'] = card.areaName;
        card['levelList'] = this.levelService.findAllSuperiorLevelsById(
          String(card.areaId),
          levelMap,
        );
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
      const cardUUIDisNotUnique = await this.cardRepository.exists({
        where: { cardUUID: createCardDTO.cardUUID },
      });

      if (cardUUIDisNotUnique) {
        throw new ValidationException(
          ValidationExceptionType.DUPLICATE_CARD_UUID,
        );
      }

      const site = await this.siteService.findById(createCardDTO.siteId);
      var priority = new PriorityEntity();
      if (createCardDTO.priorityId && createCardDTO.priorityId !== 0) {
        priority = await this.priorityService.findById(
          createCardDTO.priorityId,
        );
      }
      const area = await this.levelService.findById(createCardDTO.areaId);
      const cardType = await this.cardTypeService.findById(
        createCardDTO.cardTypeId,
      );
      const preclassifier = await this.preclassifierService.findById(
        createCardDTO.preclassifierId,
      );
      const creator = await this.userService.findById(createCardDTO.creatorId);

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
      } else if (!creator) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.USER);
      }

      var lastInsertedCard;
      lastInsertedCard = await this.cardRepository.findOne({
        order: { id: 'DESC' },
        where: { siteId: site.id },
      });

      const card = await this.cardRepository.create({
        ...createCardDTO,
        siteCardId: lastInsertedCard ? lastInsertedCard.siteCardId + 1 : 1,
        siteCode: site.siteCode,
        cardTypeColor: cardType.color,
        areaName: area.name,
        level: area.level,
        superiorId: Number(area.superiorId) === 0 ? area.id : area.superiorId,
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
        createdAt: new Date(),
        cardDueDate: new Date(),
        commentsAtCardCreation: createCardDTO.comments,
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
            createdAt: new Date(),
          });
          await this.evidenceRepository.save(evidenceToCreate);
        }),
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
        note: stringConstants.noteDefinitiveSoluition,
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
        const levelMap = await this.levelService.findAllLevels();
        for (const card of cards) {
          card['levelName'] = card.areaName;
          card['levelList'] = this.levelService.findAllSuperiorLevelsById(
            String(card.areaId),
            levelMap,
          );
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
        note: `${stringConstants.noteProvisionalSolution} ${card.userAppProvisionalSolutionId} ${card.userAppProvisionalSolutionName} ${stringConstants.aplico} ${card.userAppDefinitiveSolutionId} ${card.userAppProvisionalSolutionName}`,
        createdAt: new Date(),
      });

      await this.cardNoteRepository.save(note);

      return card;
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findAllEvidences = async () => {
    const evidences = await this.evidenceRepository.find();
    const evidencesMap = new Map();
    evidences.forEach((level) => evidencesMap.set(level.id, level));
    return evidencesMap;
  };
}
