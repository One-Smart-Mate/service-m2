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

  findSiteActiveLevels = async (siteId: number, page: number = 1, limit: number = 50) => {
    try {
      const skip = (page - 1) * limit;

      const [data, total] = await this.levelRepository.findAndCount({
        where: {
          siteId: siteId,
          status: stringConstants.A,
        },
        skip,
        take: limit,
      });

      return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      };
    } catch (exception) {
      HandleException.exception(exception);
    }
  };
  findSiteLevels = async (siteId: number, page: number = 1, limit: number = 50) => {
    try {
      const skip = (page - 1) * limit;

      const [data, total] = await this.levelRepository.findAndCount({
        where: { siteId: siteId },
        skip,
        take: limit,
      });

      return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      };
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
        true, // Exclude web tokens - web always loads data online
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

      const tokens = await this.usersService.getSiteUsersTokens(level.siteId, true); // Exclude web tokens - web always loads data online
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
  async findActiveLevelsWithCardLocation(siteId: number, page: number = 1, limit: number = 50) {
    try {
      const result = await this.findSiteActiveLevels(siteId, page, limit);

      // Get all active levels to build complete location paths
      const allLevels = await this.levelRepository.findBy({
        siteId: siteId,
        status: stringConstants.A,
      });

      const levelMap = new Map<number, any>();
      allLevels.forEach(level => levelMap.set(level.id, level));

      const dataWithLocation = result.data.map(level => ({
        ...level,
        levelLocation: this.buildLevelLocation(level.id, levelMap),
      }));

      return {
        data: dataWithLocation,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        hasMore: result.hasMore,
      };
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

      const tokens = await this.usersService.getSiteUsersTokens(levelToMove.siteId, true); // Exclude web tokens - web always loads data online
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
  getLevelTreeLazy = async (siteId: number, parentId?: number, depth: number = 2, page: number = 1, limit: number = 50) => {
    try {
      const skip = (page - 1) * limit;

      // Count total root levels
      const totalCount = await this.levelRepository.count({
        where: {
          siteId: siteId,
          status: stringConstants.A,
          ...(parentId ? { superiorId: parentId } : { superiorId: In([0, null]) })
        },
      });

      // If no parentId, get root levels with pagination
      const rootLevels = await this.levelRepository.find({
        where: {
          siteId: siteId,
          status: stringConstants.A,
          ...(parentId ? { superiorId: parentId } : { superiorId: In([0, null]) })
        },
        skip,
        take: limit,
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

      // Return the tree data with metadata and pagination
      return {
        data: treeData,
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: page * limit < totalCount,
        parentId: parentId || null,
        depth: depth
      };
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  // Get only direct children of a level
  getChildrenLevels = async (siteId: number, parentId: number, page: number = 1, limit: number = 50) => {
    try {
      const skip = (page - 1) * limit;

      const [children, total] = await this.levelRepository.findAndCount({
        where: {
          siteId: siteId,
          superiorId: parentId,
          status: stringConstants.A
        },
        skip,
        take: limit,
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

      return {
        data: childrenWithMeta,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      };
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  // Get statistics about levels
  getLevelStats = async (siteId: number, page: number = 1, limit: number = 50) => {
    try {
      const skip = (page - 1) * limit;

      // Get detailed level data with pagination
      const [levels, totalLevels] = await this.levelRepository.findAndCount({
        where: { siteId: siteId },
        skip,
        take: limit,
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
        data: levels,
        total: totalLevels,
        page,
        limit,
        totalPages: Math.ceil(totalLevels / limit),
        hasMore: page * limit < totalLevels,
        stats: {
          totalLevels,
          activeLevels,
          inactiveLevels: totalLevels - activeLevels,
          rootLevels,
          maxDepth,
          performanceWarning: totalLevels > 1000
        }
      };
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  // Clone a level with all its descendants recursively
  cloneLevel = async (levelId: number, nameSuffix: string = ' (Copy)') => {
    try {
      // 1. Find the original level
      const originalLevel = await this.levelRepository.findOne({
        where: { id: levelId }
      });

      if (!originalLevel) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.LEVELS);
      }

      // 2. Start a transaction
      const queryRunner = this.levelRepository.manager.connection.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // 3. Clone the main level and all its descendants recursively
        // The cloned level will be a sibling (same parent) of the original
        // Calculate parent level: if superiorId is 0, parent level doesn't matter (will be 0)
        // Otherwise, parent level = original level - 1
        const parentLevel = originalLevel.superiorId === 0 ? 0 : (originalLevel.level || 1) - 1;

        const clonedLevelId = await this.cloneLevelRecursive(
          originalLevel,
          originalLevel.superiorId, // Use the same parent as the original
          nameSuffix,
          queryRunner,
          null, // oldToNewIdMap
          parentLevel // Pass the parent's level
        );

        // 4. Commit the transaction
        await queryRunner.commitTransaction();

        // 5. Get the cloned level with all its data
        const clonedLevel = await this.levelRepository.findOne({
          where: { id: clonedLevelId }
        });

        // 6. Get all descendants of the cloned level
        const allClonedDescendants = await this.findAllChildLevels(clonedLevelId);

        // 7. Send notification
        const tokens = await this.usersService.getSiteUsersTokens(originalLevel.siteId, true); // Exclude web tokens - web always loads data online
        await this.firebaseService.sendMultipleMessage(
          new NotificationDTO(
            stringConstants.catalogsTitle,
            stringConstants.catalogsDescription,
            stringConstants.catalogsNotificationType,
          ),
          tokens,
        );

        return {
          clonedLevel,
          totalCloned: allClonedDescendants.length
        };
      } catch (error) {
        // Rollback in case of error
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        // Release the query runner
        await queryRunner.release();
      }
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  // Helper method to clone a level and all its children recursively
  private cloneLevelRecursive = async (
    originalLevel: LevelEntity,
    newSuperiorId: number,
    nameSuffix: string,
    queryRunner: any,
    oldToNewIdMap: Map<number, number> | null,
    parentLevel: number = 0
  ): Promise<number> => {
    // Initialize the map on the first call
    if (!oldToNewIdMap) {
      oldToNewIdMap = new Map<number, number>();
    }

    // 1. Create the cloned level (without id, timestamps)
    const { id, createdAt, updatedAt, deletedAt, ...levelData } = originalLevel;
    console.log(`Cloning level ${id} - timestamps: ${createdAt}, ${updatedAt}, ${deletedAt}`);

    // 2. Calculate the new level depth based on parent
    let newLevel = 0;
    if (newSuperiorId === 0) {
      newLevel = 0;
    } else {
      newLevel = parentLevel + 1;
    }

    // 3. Generate unique levelMachineId
    let levelMachineId = null;
    if (!originalLevel.levelMachineId) {
      levelMachineId = generateRandomHex(6);
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 10;

      while (!isUnique && attempts < maxAttempts) {
        const existingLevel = await this.levelRepository.findOne({
          where: {
            levelMachineId,
            siteId: originalLevel.siteId
          }
        });

        if (!existingLevel) {
          isUnique = true;
        } else {
          levelMachineId = generateRandomHex(6);
          attempts++;
        }
      }
    }

    // 4. Create the new level
    const newLevelData = this.levelRepository.create({
      ...levelData,
      name: levelData.name + nameSuffix,
      superiorId: newSuperiorId,
      level: newLevel,
      levelMachineId: levelMachineId,
      createdAt: new Date(),
    });

    const savedLevel = await queryRunner.manager.save(LevelEntity, newLevelData);

    // Store the mapping from old ID to new ID
    oldToNewIdMap.set(originalLevel.id, savedLevel.id);

    // 5. Find all direct children of the original level (not just active ones)
    const children = await this.levelRepository.find({
      where: { superiorId: originalLevel.id },
      order: { id: 'ASC' }
    });

    console.log(`Found ${children.length} children for level ${originalLevel.id}`);

    // 6. Recursively clone all children
    for (const child of children) {
      await this.cloneLevelRecursive(
        child,
        savedLevel.id, // The new parent is the cloned level
        nameSuffix,
        queryRunner,
        oldToNewIdMap,
        savedLevel.level // Pass the parent's level for calculating child levels
      );
    }

    return savedLevel.id;
  };
}
