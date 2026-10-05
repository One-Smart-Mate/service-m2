import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { CreateLevelDto } from './models/dto/create.level.dto';
import { UpdateLevelDTO } from './models/dto/update.level.dto';
import { MoveLevelDto } from './models/dto/move.level.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { LevelEntity } from './entities/level.entity';
import { EntityManager, In, IsNull, Not, Repository } from 'typeorm';
import { LevelHierarchyPersistence } from './level-hierarchy.persistence';
import {
  collectLevelDescendants,
  levelMapFrom,
  MAX_LEVEL_HIERARCHY_DEPTH,
  normalizeLevelId,
  traceLevelHierarchy,
  visitHierarchyLevel,
} from './level-hierarchy.policy';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';
import {
  NotFoundCustomException,
  NotFoundCustomExceptionType,
} from 'src/common/exceptions/types/notFound.exception';
import { UsersService } from '../users/users.service';
import { SiteEntity } from '../site/entities/site.entity';
import { stringConstants } from 'src/utils/string.constant';
import { FirebaseService } from '../firebase/firebase.service';
import { NotificationDTO } from '../firebase/models/firebase.request.dto';
import {
  ValidationException,
  ValidationExceptionType,
} from 'src/common/exceptions/types/validation.exception';
import { generateRandomHex } from 'src/utils/general.functions';
import { applyCatalogLifecycle } from '../catalog/catalog-lifecycle';
import {
  assertActiveCatalogSite,
  resolveCatalogAssignee,
} from '../catalog/catalog-assignment.policy';

@Injectable()
export class LevelService {
  private readonly logger = new Logger(LevelService.name);

  constructor(
    @InjectRepository(LevelEntity)
    private readonly levelRepository: Repository<LevelEntity>,
    private readonly hierarchyPersistence: LevelHierarchyPersistence,
    private readonly usersService: UsersService,
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

  findSiteActiveLevels = async (
    siteId: number,
    page: number = 1,
    limit: number = 50,
  ) => {
    try {
      const skip = (page - 1) * limit;

      const [data, total] = await this.levelRepository.findAndCount({
        where: {
          siteId: siteId,
          status: stringConstants.A,
          deletedAt: IsNull(),
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
  findSiteLevels = async (
    siteId: number,
    page: number = 1,
    limit: number = 50,
  ) => {
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
      const responsible = createLevelDTO.responsibleId
        ? await resolveCatalogAssignee(
            this.usersService,
            Number(createLevelDTO.responsibleId),
            createLevelDTO.siteId,
          )
        : null;
      const savedLevel = await this.hierarchyPersistence.inSite(
        createLevelDTO.siteId,
        async (manager) => {
          const repository = manager.getRepository(LevelEntity);
          const site = await manager.findOneBy(SiteEntity, {
            id: createLevelDTO.siteId,
          });
          if (!site) {
            throw new NotFoundCustomException(NotFoundCustomExceptionType.SITE);
          }
          assertActiveCatalogSite(site);

          if (createLevelDTO.levelMachineId) {
            const levelMachineIdExists = await repository.findOne({
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
            createLevelDTO.responsibleName = responsible.name;
          }
          createLevelDTO.companyId = site.companyId;
          createLevelDTO.createdAt = new Date();

          createLevelDTO.superiorId = normalizeLevelId(
            createLevelDTO.superiorId ?? 0,
            true,
          );
          createLevelDTO.level = 0;
          if (createLevelDTO.superiorId) {
            const parent = await repository.findOneBy({
              id: createLevelDTO.superiorId,
            });
            if (
              !parent ||
              Number(parent.siteId) !== Number(createLevelDTO.siteId) ||
              parent.status !== stringConstants.A ||
              parent.deletedAt != null
            ) {
              throw new NotFoundCustomException(
                NotFoundCustomExceptionType.LEVELS,
              );
            }
            const levels = levelMapFrom(
              await repository.findBy({ siteId: createLevelDTO.siteId }),
            );
            createLevelDTO.level = traceLevelHierarchy(
              Number(parent.id),
              levels,
            ).length;
            if (createLevelDTO.level >= MAX_LEVEL_HIERARCHY_DEPTH) {
              throw new BadRequestException(
                'Level hierarchy exceeds the maximum depth',
              );
            }
          }

          if (!createLevelDTO.levelMachineId) {
            let levelMachineId = generateRandomHex(6);
            let isUnique = false;
            let attempts = 0;
            const maxAttempts = 10;

            while (!isUnique && attempts < maxAttempts) {
              const existingLevel = await repository.findOne({
                where: {
                  levelMachineId,
                  siteId: createLevelDTO.siteId,
                },
              });

              if (!existingLevel) {
                isUnique = true;
              } else {
                levelMachineId = generateRandomHex(6);
                attempts++;
              }
            }

            if (!isUnique) {
              throw new ValidationException(
                ValidationExceptionType.DUPLICATED_LEVELMACHINEID,
              );
            }
            createLevelDTO.levelMachineId = levelMachineId;
          }

          return repository.save(createLevelDTO);
        },
      );
      await this.notifyCatalogChange(createLevelDTO.siteId);
      return savedLevel;
    } catch (exception) {
      HandleException.exception(exception);
    }
  };
  update = async (updateLevelDTO: UpdateLevelDTO) => {
    try {
      const snapshot = await this.levelRepository.findOneBy({
        id: updateLevelDTO.id,
      });
      if (!snapshot)
        throw new NotFoundCustomException(NotFoundCustomExceptionType.LEVELS);
      const responsible = updateLevelDTO.responsibleId
        ? await resolveCatalogAssignee(
            this.usersService,
            Number(updateLevelDTO.responsibleId),
            Number(snapshot.siteId),
          )
        : null;
      const savedLevel = await this.hierarchyPersistence.withLevel(
        updateLevelDTO.id,
        async (manager, level) => {
          const repository = manager.getRepository(LevelEntity);
          level.responsibleName = null;

          if (updateLevelDTO.responsibleId) {
            level.responsibleName = responsible.name;
          }

          if (updateLevelDTO.levelMachineId) {
            const levelMachineIdExists = await repository.findOne({
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

          const statusChanged = updateLevelDTO.status !== level.status;
          let descendantIds: number[] = [];
          if (statusChanged) {
            const levels = levelMapFrom(
              await repository.findBy({ siteId: Number(level.siteId) }),
            );
            const allLevels = collectLevelDescendants(Number(level.id), levels);
            descendantIds = allLevels
              .map(Number)
              .filter((levelId) => levelId !== Number(level.id));
          }

          level.responsibleId = updateLevelDTO.responsibleId;
          const changedAt = new Date();
          applyCatalogLifecycle(level, updateLevelDTO.status, changedAt);

          if (descendantIds.length > 0) {
            await manager.update(
              LevelEntity,
              { id: In(descendantIds), siteId: Number(level.siteId) },
              {
                status: updateLevelDTO.status,
                updatedAt: changedAt,
                deletedAt:
                  updateLevelDTO.status === stringConstants.A
                    ? null
                    : changedAt,
              },
            );
          }
          return repository.save(level);
        },
      );

      await this.notifyCatalogChange(Number(savedLevel.siteId));
      return savedLevel;
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
    const levels = levelMapFrom([...levelMap.values()]);
    const id = normalizeLevelId(levelId);
    if (!levels.has(id)) {
      return { area: { id, name: 'Unknown Level' }, location: 'Unknown Level' };
    }
    const path = traceLevelHierarchy(id, levels);
    return {
      area: path[path.length - 1],
      location: [...path]
        .reverse()
        .map(({ name }) => name)
        .join('/'),
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
    const root = await this.levelRepository.findOneBy({
      id: normalizeLevelId(superiorId),
    });
    if (!root) return [];
    const levels = await this.levelRepository.findBy({
      siteId: Number(root.siteId),
    });
    return collectLevelDescendants(Number(root.id), levelMapFrom(levels));
  };
  async findActiveLevelsWithCardLocation(
    siteId: number,
    page: number = 1,
    limit: number = 50,
  ) {
    try {
      const result = await this.findSiteActiveLevels(siteId, page, limit);

      // Get all active levels to build complete location paths
      const allLevels = await this.levelRepository.findBy({
        siteId: siteId,
        status: stringConstants.A,
        deletedAt: IsNull(),
      });

      const levelMap = levelMapFrom(allLevels);

      const dataWithLocation = result.data.map((level) => ({
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

  private buildLevelLocation(
    levelId: number,
    levels: Map<number, LevelEntity>,
  ): string {
    if (!levels.has(normalizeLevelId(levelId))) return '';
    return traceLevelHierarchy(Number(levelId), levels)
      .reverse()
      .map(({ name }) => name)
      .join('/');
  }

  private async findAncestorPath(levelId: number): Promise<LevelEntity[]> {
    let current = await this.levelRepository.findOneBy({
      id: normalizeLevelId(levelId),
    });
    if (!current)
      throw new NotFoundCustomException(NotFoundCustomExceptionType.LEVELS);
    const siteId = Number(current.siteId);
    const path: LevelEntity[] = [];
    const visited = new Set<number>();
    while (current) {
      visitHierarchyLevel(current, visited, siteId);
      path.push(current);
      const parentId = normalizeLevelId(current.superiorId ?? 0, true);
      if (!parentId) break;
      current = await this.levelRepository.findOneBy({ id: parentId, siteId });
      if (!current)
        throw new ConflictException('Level hierarchy has a missing parent');
    }
    return path;
  }

  findLastLevelFromNode = async (levelId: number) => {
    try {
      const path = await this.findAncestorPath(levelId);
      const root = path[path.length - 1];
      return { area_id: root.id, area_name: root.name };
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  getLevelPathById = async (levelId: number): Promise<string> => {
    try {
      return (await this.findAncestorPath(levelId))
        .reverse()
        .map(({ name }) => name)
        .join('/');
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  moveLevel = async (input: MoveLevelDto) => {
    try {
      const { siteId, response } = await this.hierarchyPersistence.move(input);
      await this.notifyCatalogChange(siteId);
      return response;
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

      const levelPath = (
        await this.findAncestorPath(Number(level.id))
      ).reverse();
      const pathString = levelPath.map(({ name }) => name).join('/');

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
  getLevelTreeLazy = async (
    siteId: number,
    parentId?: number,
    depth: number = 2,
    page: number = 1,
    limit: number = 50,
  ) => {
    try {
      if (
        !Number.isSafeInteger(depth) ||
        depth < 1 ||
        depth > MAX_LEVEL_HIERARCHY_DEPTH
      ) {
        throw new BadRequestException('Invalid level tree depth');
      }
      const skip = (page - 1) * limit;

      // Count total root levels
      const totalCount = await this.levelRepository.count({
        where: {
          siteId: siteId,
          status: stringConstants.A,
          deletedAt: IsNull(),
          ...(parentId
            ? { superiorId: parentId }
            : { superiorId: In([0, null]) }),
        },
      });

      // If no parentId, get root levels with pagination
      const rootLevels = await this.levelRepository.find({
        where: {
          siteId: siteId,
          status: stringConstants.A,
          deletedAt: IsNull(),
          ...(parentId
            ? { superiorId: parentId }
            : { superiorId: In([0, null]) }),
        },
        skip,
        take: limit,
      });

      // Recursively load children up to specified depth
      const loadChildrenRecursive = async (
        levels: LevelEntity[],
        currentDepth: number,
        ancestors = new Set<number>(),
      ): Promise<any[]> => {
        if (currentDepth <= 0) {
          // Just mark if they have children without loading them
          return Promise.all(
            levels.map(async (level) => {
              visitHierarchyLevel(level, new Set(ancestors), Number(siteId));
              const childCount = await this.levelRepository.count({
                where: {
                  superiorId: level.id,
                  siteId,
                  status: stringConstants.A,
                  deletedAt: IsNull(),
                },
              });
              return {
                ...level,
                hasChildren: childCount > 0,
                childrenCount: childCount,
                children: [],
              };
            }),
          );
        }

        return Promise.all(
          levels.map(async (level) => {
            const visited = new Set(ancestors);
            visitHierarchyLevel(level, visited, Number(siteId));
            const children = await this.levelRepository.find({
              where: {
                superiorId: level.id,
                siteId,
                status: stringConstants.A,
                deletedAt: IsNull(),
              },
            });

            const childrenWithNested = await loadChildrenRecursive(
              children,
              currentDepth - 1,
              visited,
            );

            return {
              ...level,
              hasChildren: children.length > 0,
              childrenCount: children.length,
              children: childrenWithNested,
            };
          }),
        );
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
        depth: depth,
      };
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  // Get only direct children of a level
  getChildrenLevels = async (
    siteId: number,
    parentId: number,
    page: number = 1,
    limit: number = 50,
  ) => {
    try {
      const skip = (page - 1) * limit;

      const [children, total] = await this.levelRepository.findAndCount({
        where: {
          siteId: siteId,
          superiorId: parentId,
          status: stringConstants.A,
          deletedAt: IsNull(),
        },
        skip,
        take: limit,
      });

      // For each child, check if it has children
      const childrenWithMeta = await Promise.all(
        children.map(async (child) => {
          const grandchildrenCount = await this.levelRepository.count({
            where: {
              superiorId: child.id,
              status: stringConstants.A,
              deletedAt: IsNull(),
            },
          });

          return {
            ...child,
            hasChildren: grandchildrenCount > 0,
            childrenCount: grandchildrenCount,
          };
        }),
      );

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
  getLevelStats = async (
    siteId: number,
    page: number = 1,
    limit: number = 50,
  ) => {
    try {
      const skip = (page - 1) * limit;

      // Get detailed level data with pagination
      const [levels, totalLevels] = await this.levelRepository.findAndCount({
        where: { siteId: siteId },
        skip,
        take: limit,
      });

      const activeLevels = await this.levelRepository.count({
        where: {
          siteId: siteId,
          status: stringConstants.A,
          deletedAt: IsNull(),
        },
      });

      const rootLevels = await this.levelRepository.count({
        where: {
          siteId: siteId,
          status: stringConstants.A,
          deletedAt: IsNull(),
          superiorId: In([0, null]),
        },
      });

      const activeTree = levelMapFrom(
        await this.levelRepository.findBy({
          siteId,
          status: stringConstants.A,
          deletedAt: IsNull(),
        }),
      );
      let maxDepth = 0;
      for (const id of activeTree.keys()) {
        maxDepth = Math.max(
          maxDepth,
          traceLevelHierarchy(id, activeTree).length,
        );
      }

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
          performanceWarning: totalLevels > 1000,
        },
      };
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  cloneLevel = async (levelId: number, nameSuffix: string = ' (Copy)') => {
    try {
      const result = await this.hierarchyPersistence.withLevel(
        levelId,
        async (manager, originalLevel) => {
          const levels = levelMapFrom(
            await manager.findBy(LevelEntity, {
              siteId: Number(originalLevel.siteId),
            }),
          );
          const path = traceLevelHierarchy(Number(originalLevel.id), levels);
          collectLevelDescendants(Number(originalLevel.id), levels);
          const oldToNewIdMap = new Map<number, number>();
          const clonedLevelId = await this.cloneLevelRecursive(
            originalLevel,
            normalizeLevelId(originalLevel.superiorId ?? 0, true),
            nameSuffix,
            manager,
            oldToNewIdMap,
            Math.max(0, path.length - 2),
          );
          const clonedLevel = await manager.findOneBy(LevelEntity, {
            id: clonedLevelId,
          });
          return {
            siteId: Number(originalLevel.siteId),
            clonedLevel,
            totalCloned: oldToNewIdMap.size,
          };
        },
      );
      await this.notifyCatalogChange(result.siteId);
      return {
        clonedLevel: result.clonedLevel,
        totalCloned: result.totalCloned,
      };
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  // Helper method to clone a level and all its children recursively
  private cloneLevelRecursive = async (
    originalLevel: LevelEntity,
    newSuperiorId: number,
    nameSuffix: string,
    manager: EntityManager,
    oldToNewIdMap: Map<number, number> | null,
    parentLevel: number = 0,
  ): Promise<number> => {
    // Initialize the map on the first call
    if (!oldToNewIdMap) {
      oldToNewIdMap = new Map<number, number>();
    }

    const sourceId = normalizeLevelId(originalLevel.id);
    if (
      oldToNewIdMap.has(sourceId) ||
      parentLevel >= MAX_LEVEL_HIERARCHY_DEPTH - 1
    ) {
      throw new BadRequestException(
        'Level hierarchy contains a cycle or exceeds the maximum depth',
      );
    }
    // 1. Create the cloned level (without id, timestamps)
    const levelData = { ...originalLevel };
    delete levelData.id;
    delete levelData.createdAt;
    delete levelData.updatedAt;
    delete levelData.deletedAt;

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
        const existingLevel = await manager.findOne(LevelEntity, {
          where: {
            levelMachineId,
            siteId: originalLevel.siteId,
          },
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

    const savedLevel = await manager.save(LevelEntity, newLevelData);

    // Store the mapping from old ID to new ID
    oldToNewIdMap.set(sourceId, normalizeLevelId(savedLevel.id));

    // 5. Find all direct children of the original level (not just active ones)
    const children = await manager.find(LevelEntity, {
      where: { superiorId: sourceId, siteId: Number(originalLevel.siteId) },
      order: { id: 'ASC' },
    });

    // 6. Recursively clone all children
    for (const child of children) {
      await this.cloneLevelRecursive(
        child,
        normalizeLevelId(savedLevel.id), // The new parent is the cloned level
        nameSuffix,
        manager,
        oldToNewIdMap,
        savedLevel.level, // Pass the parent's level for calculating child levels
      );
    }

    return normalizeLevelId(savedLevel.id);
  };

  private async notifyCatalogChange(siteId: number): Promise<void> {
    try {
      const tokens = await this.usersService.getSiteUsersTokens(siteId, true);
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
        `Level ${siteId} was saved but catalog notification failed`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
