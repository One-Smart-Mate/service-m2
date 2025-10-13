import { Injectable } from '@nestjs/common';
import { CreateLevelDto } from './models/dto/create.level.dto';
import { UpdateLevelDTO } from './models/dto/update.level.dto';
import { MoveLevelDto } from './models/dto/move.level.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { LevelEntity } from './entities/level.entity';
import { CardEntity } from '../card/entities/card.entity';
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
    @InjectRepository(CardEntity)
    private readonly cardRepository: Repository<CardEntity>,
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
      level.notify = updateLevelDTO.notify;

      // Update assignWhileCreate if provided
      if (updateLevelDTO.assignWhileCreate !== undefined) {
        level.assignWhileCreate = updateLevelDTO.assignWhileCreate;
      }

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

  private updateCardsForLevel = async (levelId: number, levelMap: Map<string, any>) => {
    try {
      const level = levelMap.get(String(levelId));
      if (!level) return;

      const { area, location } = this.getSuperiorLevelsById(String(levelId), levelMap);

      const cardSuperiorId = level.superiorId === 0 ? levelId : level.superiorId;

      await this.cardRepository.update(
        { nodeId: levelId },
        {
          cardLocation: location,
          areaId: area.id,
          areaName: area.name,
          nodeName: level.name,
          level: level.level,
          superiorId: cardSuperiorId,
          updatedAt: new Date()
        }
      );
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  moveLevel = async (moveLevelDto: MoveLevelDto) => {
    try {
      const levelToMove = await this.findById(moveLevelDto.levelId);
      if (!levelToMove || levelToMove.deletedAt !== null) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.LEVELS);
      }

      if (moveLevelDto.newSuperiorId !== 0) {
        const newSuperior = await this.findById(moveLevelDto.newSuperiorId);
        if (!newSuperior) {
          throw new NotFoundCustomException(NotFoundCustomExceptionType.LEVELS);
        }

        if (levelToMove.siteId !== newSuperior.siteId) {
          throw new ValidationException(
            ValidationExceptionType.DUPLICATE_RECORD,
          );
        }

        const allChildLevels = await this.findAllChildLevels(moveLevelDto.levelId);
        if (allChildLevels.includes(moveLevelDto.newSuperiorId)) {
          throw new ValidationException(
            ValidationExceptionType.DUPLICATE_RECORD,
          );
        }
      }

      if (levelToMove.superiorId === moveLevelDto.newSuperiorId) {
        return {
          message: 'The level is already in the requested position',
          level: levelToMove,
        };
      }

      const childLevels = await this.levelRepository.find({
        where: { superiorId: moveLevelDto.levelId }
      });

      // Capture child IDs and their descendants BEFORE reassigning
      const reassignedLevelIds: number[] = [];
      if (childLevels.length > 0) {
        for (const child of childLevels) {
          const childAndDescendants = await this.findAllChildLevels(child.id);
          reassignedLevelIds.push(...childAndDescendants);
        }
      }

      const oldSuperiorId = levelToMove.superiorId;
      levelToMove.superiorId = moveLevelDto.newSuperiorId;

      if (moveLevelDto.newSuperiorId === 0) {
        levelToMove.level = 0;
      } else {
        levelToMove.level = await this.getActualLevelBySuperiorId(moveLevelDto.newSuperiorId);
      }

      levelToMove.updatedAt = new Date();

      const movedLevel = await this.levelRepository.save(levelToMove);

      if (childLevels.length > 0) {
        await this.levelRepository.update(
          { superiorId: moveLevelDto.levelId },
          {
            superiorId: oldSuperiorId,
            updatedAt: new Date()
          }
        );

        for (const childLevel of childLevels) {
          if (oldSuperiorId === 0) {
            childLevel.level = 0;
          } else {
            childLevel.level = await this.getActualLevelBySuperiorId(oldSuperiorId);
          }
          await this.levelRepository.save(childLevel);
        }
      }

      // Get all levels affected by the move:
      // 1. The moved level and its descendants (that stayed with it)
      // 2. The reassigned children and their descendants
      const movedLevelAndDescendants = await this.findAllChildLevels(moveLevelDto.levelId);
      const allAffectedLevels = [...new Set([...movedLevelAndDescendants, ...reassignedLevelIds])];

      const levelMap = await this.findAllLevelsBySite(levelToMove.siteId);

      for (const affectedLevelId of allAffectedLevels) {
        await this.updateCardsForLevel(affectedLevelId, levelMap);
      }

      const tokens = await this.usersService.getSiteUsersTokens(levelToMove.siteId);
      await this.firebaseService.sendMultipleMessage(
        new NotificationDTO(
          stringConstants.catalogsTitle,
          stringConstants.catalogsDescription,
          stringConstants.catalogsNotificationType,
        ),
        tokens,
      );

      return {
        level: movedLevel,
        childrenUpdated: childLevels.length,
        cardsUpdated: allAffectedLevels.length,
      };
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findByMachineIdWithPath = async (siteId: number, machineId: string) => {
    try {
      // First find the level by machine ID
      const level = await this.levelRepository.findOne({
        where: {
          siteId: siteId,
          levelMachineId: machineId,
        },
      });

      if (!level) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.LEVELS);
      }

      // Get the full path from this level to the root
      const pathString = await this.getLevelPathById(level.id);

      // Build the hierarchy - get all levels in the path
      const levelPath: LevelEntity[] = [];
      let currentLevel = level;
      levelPath.unshift(currentLevel);

      while (currentLevel.superiorId && Number(currentLevel.superiorId) !== 0) {
        const parent = await this.levelRepository.findOne({
          where: { id: currentLevel.superiorId },
        });
        if (!parent) break;
        levelPath.unshift(parent);
        currentLevel = parent;
      }

      return {
        level,
        path: pathString,
        hierarchy: levelPath,
      };
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  // Get level tree with lazy loading - only loads specified depth
  getLevelTreeLazy = async (siteId: number, parentId?: number, depth: number = 2) => {
    try {
      // If no parentId, get root levels
      const rootLevels = await this.levelRepository.find({
        where: {
          siteId: siteId,
          status: stringConstants.A,
          ...(parentId ? { superiorId: parentId } : { superiorId: In([0, null]) })
        },
      });

      // Recursively load children up to specified depth
      const loadChildrenRecursive = async (levels: LevelEntity[], currentDepth: number): Promise<any[]> => {
        if (currentDepth <= 0) {
          // Just mark if they have children without loading them
          return Promise.all(levels.map(async (level) => {
            const childCount = await this.levelRepository.count({
              where: { superiorId: level.id, status: stringConstants.A }
            });
            return {
              ...level,
              hasChildren: childCount > 0,
              childrenCount: childCount,
              children: []
            };
          }));
        }

        return Promise.all(levels.map(async (level) => {
          const children = await this.levelRepository.find({
            where: { superiorId: level.id, status: stringConstants.A }
          });

          const childrenWithNested = await loadChildrenRecursive(children, currentDepth - 1);

          return {
            ...level,
            hasChildren: children.length > 0,
            childrenCount: children.length,
            children: childrenWithNested
          };
        }));
      };

      const treeData = await loadChildrenRecursive(rootLevels, depth - 1);

      // Return the tree data with metadata for compatibility
      return {
        data: treeData,
        parentId: parentId || null,
        depth: depth
      };
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  // Get only direct children of a level
  getChildrenLevels = async (siteId: number, parentId: number) => {
    try {
      const children = await this.levelRepository.find({
        where: {
          siteId: siteId,
          superiorId: parentId,
          status: stringConstants.A
        }
      });

      // For each child, check if it has children
      const childrenWithMeta = await Promise.all(children.map(async (child) => {
        const grandchildrenCount = await this.levelRepository.count({
          where: { superiorId: child.id, status: stringConstants.A }
        });

        return {
          ...child,
          hasChildren: grandchildrenCount > 0,
          childrenCount: grandchildrenCount
        };
      }));

      return childrenWithMeta;
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  // Get statistics about levels
  getLevelStats = async (siteId: number) => {
    try {
      const totalLevels = await this.levelRepository.count({
        where: { siteId: siteId }
      });

      const activeLevels = await this.levelRepository.count({
        where: { siteId: siteId, status: stringConstants.A }
      });

      const rootLevels = await this.levelRepository.count({
        where: {
          siteId: siteId,
          status: stringConstants.A,
          superiorId: In([0, null])
        }
      });

      // Get max depth
      const query = `
        WITH RECURSIVE level_depth AS (
          SELECT id, superior_id, 1 as depth
          FROM levels
          WHERE site_id = ? AND (superior_id = 0 OR superior_id IS NULL) AND status = 'A'

          UNION ALL

          SELECT l.id, l.superior_id, ld.depth + 1
          FROM levels l
          INNER JOIN level_depth ld ON l.superior_id = ld.id
          WHERE l.site_id = ? AND l.status = 'A'
        )
        SELECT MAX(depth) as maxDepth FROM level_depth;
      `;

      const maxDepthResult = await this.levelRepository.query(query, [siteId, siteId]);
      const maxDepth = maxDepthResult[0]?.maxDepth || 0;

      return {
        totalLevels,
        activeLevels,
        inactiveLevels: totalLevels - activeLevels,
        rootLevels,
        maxDepth,
        performanceWarning: totalLevels > 1000
      };
    } catch (exception) {
      HandleException.exception(exception);
    }
  };
}
