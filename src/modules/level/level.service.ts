import { Injectable } from '@nestjs/common';
import { CreateLevelDto } from './models/dto/create.level.dto';
import { UpdateLevelDTO } from './models/dto/update.level.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { LevelEntity } from './entities/level.entity';
import { In, Not, Repository } from 'typeorm';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';
import {
  NotFoundCustomException,
  NotFoundCustomExceptionType,
} from 'src/common/exceptions/types/notFound.exception';
import { UsersService } from '../users/users.service';
import { SiteService } from '../site/site.service';
import { stringConstants } from 'src/utils/string.constant';
import { FirebaseService } from '../firebase/firebase.service';
import { NotificationDTO } from '../firebase/models/firebase.request.dto';
import {
  ValidationException,
  ValidationExceptionType,
} from 'src/common/exceptions/types/validation.exception';

@Injectable()
export class LevelService {
  constructor(
    @InjectRepository(LevelEntity)
    private readonly levelRepository: Repository<LevelEntity>,
    private readonly usersService: UsersService,
    private readonly siteService: SiteService,
    private readonly firebaseService: FirebaseService,
  ) {}

  findByLeveleMachineId = async (siteId: number, levelMachineId: string) => {
    try {
      return await this.levelRepository.findOneBy({
        siteId: siteId,
        levelMachineId: levelMachineId,
      });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findSiteActiveLevels = async (siteId: number) => {
    try {
      return await this.levelRepository.findBy({
        siteId: siteId,
        status: stringConstants.A,
      });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };
  findSiteLevels = async (siteId: number) => {
    try {
      return await this.levelRepository.findBy({ siteId: siteId });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };
  create = async (createLevelDTO: CreateLevelDto) => {
    try {
      const responsible = await this.usersService.findById(
        createLevelDTO.responsibleId,
      );
      const site = await this.siteService.findById(createLevelDTO.siteId);
      if (!responsible) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.USER);
      } else if (!site) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.SITE);
      }

      const levelMachineIdExists = await this.levelRepository.findOne({
        where: {
          levelMachineId: createLevelDTO.levelMachineId,
          siteId: createLevelDTO.siteId,
        },
      });

      if (levelMachineIdExists) {
        throw new ValidationException(
          ValidationExceptionType.DUPLICATED_LEVELMACHINEID,
        );
      }

      createLevelDTO.companyId = site.companyId;
      createLevelDTO.responsibleName = responsible.name;
      createLevelDTO.createdAt = new Date();

      if (createLevelDTO.superiorId) {
        createLevelDTO.level = await this.getActualLevelBySuperiorId(
          createLevelDTO.superiorId,
        );
      }

      const tokens = await this.usersService.getSiteUsersTokens(
        createLevelDTO.siteId,
      );
      await this.firebaseService.sendMultipleMessage(
        new NotificationDTO(
          stringConstants.catalogsTitle,
          stringConstants.catalogsDescription,
          stringConstants.catalogsNotificationType,
        ),
        tokens,
      );

      return await this.levelRepository.save(createLevelDTO);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };
  update = async (updateLevelDTO: UpdateLevelDTO) => {
    try {
      const level = await this.levelRepository.findOneBy({
        id: updateLevelDTO.id,
      });
      if (!level) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.LEVELS);
      }

      const responsible = await this.usersService.findById(
        updateLevelDTO.responsibleId,
      );
      if (!responsible) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.USER);
      }

      const levelMachineIdExists = await this.levelRepository.findOne({
        where: {
          levelMachineId: updateLevelDTO.levelMachineId,
          siteId: level.siteId,
          id: Not(level.id),
        },
      });

      if (levelMachineIdExists) {
        throw new ValidationException(
          ValidationExceptionType.DUPLICATED_LEVELMACHINEID,
        );
      }

      level.name = updateLevelDTO.name;
      level.description = updateLevelDTO.description;
      level.levelMachineId = updateLevelDTO.levelMachineId;
      if (updateLevelDTO.status !== level.status) {
        const allLevels = await this.findAllChildLevels(level.id);
        if (updateLevelDTO.status !== stringConstants.A) {
          await this.levelRepository.update(
            { id: In(allLevels) },
            {
              status: updateLevelDTO.status,
              updatedAt: new Date(),
              deletedAt: new Date(),
            },
          );
        } else {
          await this.levelRepository.update(
            { id: In(allLevels) },
            {
              status: updateLevelDTO.status,
              updatedAt: new Date(),
            },
          );
        }
      }
      level.status = updateLevelDTO.status;
      level.responsibleId = updateLevelDTO.responsibleId;
      level.responsibleName = responsible.name;

      const tokens = await this.usersService.getSiteUsersTokens(level.siteId);
      await this.firebaseService.sendMultipleMessage(
        new NotificationDTO(
          stringConstants.catalogsTitle,
          stringConstants.catalogsDescription,
          stringConstants.catalogsNotificationType,
        ),
        tokens,
      );

      return await this.levelRepository.save(level);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  getActualLevelBySuperiorId = async (superiorId: number) => {
    try {
      const superiorLevel = await this.levelRepository.findOne({
        where: { id: superiorId },
        select: ['level'],
      });
      if (!superiorLevel) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.LEVELS);
      }

      const actualLevel = Number(superiorLevel.level) + 1;

      return actualLevel;
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findById = async (levelId: number) => {
    try {
      return await this.levelRepository.findOneBy({ id: levelId });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  getSuperiorLevelsById = (levelId: string, levelMap: Map<string, any>) => {
    const array: string[] = [];
    let level = levelMap.get(levelId);
    array.push(level.name);

    while (level.superiorId > 0) {
      level = levelMap.get(level.superiorId);

      array.push(level.name);
    }

    array.reverse();

    return {
      area: level,
      location: array.join('/'),
    };
  };
  findAllLevelsBySite = async (siteId: number) => {
    const levels = await this.levelRepository.find({
      where: { siteId: siteId },
    });
    const levelMap = new Map();
    levels.forEach((level) => levelMap.set(level.id, level));
    return levelMap;
  };
  findAllChildLevels = async (superiorId: number) => {
    const query = `
      WITH RECURSIVE LevelCTE AS (
        SELECT id, superior_id
        FROM levels
        WHERE id = ?

        UNION ALL

        SELECT l.id, l.superior_id
        FROM levels l
        INNER JOIN LevelCTE lc ON lc.id = l.superior_id
      )
      SELECT id FROM LevelCTE;
    `;

    const result = await this.levelRepository.query(query, [superiorId]);
    return result.map((row) => row.id);
  };
}
