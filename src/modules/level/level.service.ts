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
import { generateRandomHex } from 'src/utils/general.functions';

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
      const site = await this.siteService.findById(createLevelDTO.siteId);
      if (!site) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.SITE);
      }

      if (createLevelDTO.levelMachineId) {
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
      }

      if (createLevelDTO.responsibleId) {
        const responsible = await this.usersService.findById(
          Number(createLevelDTO.responsibleId),
        );
        if (!responsible) {
          throw new NotFoundCustomException(NotFoundCustomExceptionType.USER);
        }
        createLevelDTO.responsibleName = responsible.name;
      }
      createLevelDTO.companyId = site.companyId;
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

      const savedLevel = await this.levelRepository.save(createLevelDTO);
      
      if (!savedLevel.levelMachineId) {
        let levelMachineId = generateRandomHex(6);
        let isUnique = false;
        let attempts = 0;
        const maxAttempts = 10;
        
        while (!isUnique && attempts < maxAttempts) {
          const existingLevel = await this.levelRepository.findOne({
            where: { 
              levelMachineId, 
              siteId: createLevelDTO.siteId 
            }
          });
          
          if (!existingLevel) {
            isUnique = true;
          } else {
            levelMachineId = generateRandomHex(6);
            attempts++;
          }
        }
        
        savedLevel.levelMachineId = levelMachineId;
        await this.levelRepository.save(savedLevel);
      }

      return savedLevel;
    } catch (exception) {
      HandleException.exception(exception);
    }
  };
  update = async (updateLevelDTO: UpdateLevelDTO) => {
    try {
      console.log('this must be printed', updateLevelDTO);
      const level = await this.levelRepository.findOneBy({
        id: updateLevelDTO.id,
      });
      if (!level) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.LEVELS);
      }

      level.responsibleName = null;

      if (updateLevelDTO.responsibleId) {
        const responsible = await this.usersService.findById(
          Number(updateLevelDTO.responsibleId),
        );
        if (!responsible) {
          throw new NotFoundCustomException(NotFoundCustomExceptionType.USER);
        }
        level.responsibleName = responsible.name;
      }

      if (updateLevelDTO.levelMachineId) {
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
    
    if (!level) {
      const fallbackLevel = {
        id: parseInt(levelId),
        name: 'Unknown Level'
      };
      return {
        area: fallbackLevel,
        location: 'Unknown Level'
      };
    }
    
    array.push(level.name);

    while (level && level.superiorId > 0) {
      level = levelMap.get(level.superiorId);
      if (!level) {
        break;
      }
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
    levels.forEach((level) => {
      levelMap.set(level.id, level);
      levelMap.set(String(level.id), level);
    });
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
  async findActiveLevelsWithCardLocation(siteId: number) {
    try {
      const levels = await this.findSiteActiveLevels(siteId);
      const levelMap = new Map<number, any>();
      levels.forEach(level => levelMap.set(level.id, level));
      return levels.map(level => ({
        ...level,
        levelLocation: this.buildLevelLocation(level.id, levelMap),
      }));
    } catch (exception) {
      HandleException.exception(exception);
    }
  }
  
  private buildLevelLocation(levelId: number, levelMap: Map<number, any>): string {
    const path: string[] = [];
    let currentLevel = levelMap.get(levelId);
    if (!currentLevel) {
      return '';
    }
    while (currentLevel) {
      path.unshift(currentLevel.name); 
      if (!currentLevel.superiorId || currentLevel.superiorId === "0") {
        break; 
      }
      currentLevel = levelMap.get(currentLevel.superiorId);
    }
  
    return path.join('/'); 
  }
  findLastLevelFromNode =  async (levelId: number) => {
    try {
      let currentLevel = await this.levelRepository.findOneBy({ id: levelId });
      if (!currentLevel) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.LEVELS);
      }
  
      while (currentLevel.superiorId && Number(currentLevel.superiorId) !== 0) {
        const parent = await this.levelRepository.findOneBy({ id: currentLevel.superiorId });
        if (!parent) {
          break;
        }
        currentLevel = parent;
      }
  
      return {
        area_id: currentLevel.id,
        area_name: currentLevel.name,
      };
    } catch (exception) {
      HandleException.exception(exception);
    }
  }
  
  getLevelPathById = async (levelId: number): Promise<string> => {
    try {
      const path: string[] = [];
      let currentLevel = await this.levelRepository.findOneBy({ id: levelId });

      if (!currentLevel) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.LEVELS);
      }

      while (currentLevel) {
        path.unshift(currentLevel.name);
        if (!currentLevel.superiorId || Number(currentLevel.superiorId) === 0) {
          break;
        }
        currentLevel = await this.levelRepository.findOneBy({ id: currentLevel.superiorId });
      }

      return path.join('/');
    } catch (exception) {
      HandleException.exception(exception);
    }
  };
}
