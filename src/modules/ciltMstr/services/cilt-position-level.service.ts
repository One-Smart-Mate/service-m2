import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull } from 'typeorm';
import { CiltMstrPositionLevelsEntity } from 'src/modules/ciltMstrPositionLevels/entities/ciltMstrPositionLevels.entity';
import { UsersPositionsEntity } from 'src/modules/users/entities/users.positions.entity';
import { UserEntity } from 'src/modules/users/entities/user.entity';
import { LevelService } from 'src/modules/level/level.service';
import { CustomLoggerService } from 'src/common/logger/logger.service';

export interface LevelPathInfo {
  ciltMstrId: number;
  levelId: number;
  route: string | null;
}

@Injectable()
export class CiltPositionLevelService {
  constructor(
    @InjectRepository(CiltMstrPositionLevelsEntity)
    private readonly ciltMstrPositionLevelsRepository: Repository<CiltMstrPositionLevelsEntity>,
    @InjectRepository(UsersPositionsEntity)
    private readonly usersPositionsRepository: Repository<UsersPositionsEntity>,
    private readonly levelService: LevelService,
    private readonly logger: CustomLoggerService,
  ) {}

  /**
   * Get active position levels for a set of positions
   */
  async getActiveLevelsForPositions(positionIds: number[]): Promise<CiltMstrPositionLevelsEntity[]> {
    this.logger.logProcess('GETTING ACTIVE LEVELS FOR POSITIONS', { positionIds });
    
    const ciltPositionLevels = await this.ciltMstrPositionLevelsRepository.find({
      where: {
        positionId: In(positionIds),
        status: 'A',
        deletedAt: IsNull(),
      },
      relations: ['ciltMstr', 'level'],
    });

    this.logger.logProcess('FOUND CILT POSITION LEVELS', { count: ciltPositionLevels.length });
    return ciltPositionLevels;
  }

  /**
   * Get active position levels for a set of CILTs
   */
  async getActiveLevelsForCilts(ciltMasterIds: number[]): Promise<CiltMstrPositionLevelsEntity[]> {
    this.logger.logProcess('GETTING ACTIVE LEVELS FOR CILTS', { ciltMasterIds });
    
    const ciltPositionLevels = await this.ciltMstrPositionLevelsRepository.find({
      where: {
        ciltMstrId: In(ciltMasterIds),
        status: 'A',
        deletedAt: IsNull(),
      },
      relations: ['position', 'level'],
    });

    this.logger.logProcess('FOUND CILT POSITION LEVELS', { count: ciltPositionLevels.length });
    return ciltPositionLevels;
  }

  /**
   * Get user positions for a specific user
   */
  async getUserPositions(userId: number): Promise<UsersPositionsEntity[]> {
    this.logger.logProcess('GETTING USER POSITIONS', { userId });
    
    const userPositions = await this.usersPositionsRepository.find({
      where: { user: { id: userId } },
      relations: ['position'],
    });

    this.logger.logProcess('FOUND USER POSITIONS', { count: userPositions.length });
    return userPositions;
  }

  /**
   * Get users with specific positions
   */
  async getUsersWithPositions(positionIds: number[]): Promise<UsersPositionsEntity[]> {
    this.logger.logProcess('GETTING USERS WITH POSITIONS', { positionIds });
    
    const userPositions = await this.usersPositionsRepository.find({
      where: { 
        positionId: In(positionIds),
        deletedAt: IsNull()
      },
      relations: ['user', 'position'],
    });

    this.logger.logProcess('FOUND USERS WITH POSITIONS', { count: userPositions.length });
    return userPositions;
  }

  /**
   * Filter valid levels (without null ciltMstr)
   */
  filterValidPositionLevels(ciltPositionLevels: CiltMstrPositionLevelsEntity[]): CiltMstrPositionLevelsEntity[] {
    const validLevels = ciltPositionLevels.filter(cpl => cpl.ciltMstr !== null);
    this.logger.logProcess('FILTERED VALID POSITION LEVELS', { 
      original: ciltPositionLevels.length, 
      valid: validLevels.length 
    });
    return validLevels;
  }

  /**
   * Get level paths for multiple levels with error handling
   */
  async getLevelPaths(ciltPositionLevels: CiltMstrPositionLevelsEntity[]): Promise<LevelPathInfo[]> {
    this.logger.logProcess('GETTING LEVEL PATHS', { count: ciltPositionLevels.length });
    
    const levelPaths = await Promise.all(
      ciltPositionLevels.map(async (cpl) => {
        try {
          const route = await this.levelService.getLevelPathById(cpl.levelId);
          return { ciltMstrId: cpl.ciltMstrId, levelId: cpl.levelId, route };
        } catch (error) {
          this.logger.logProcess('ERROR GETTING LEVEL PATH', { 
            levelId: cpl.levelId, 
            error: error.message 
          });
          return { 
            ciltMstrId: cpl.ciltMstrId, 
            levelId: cpl.levelId, 
            route: null 
          };
        }
      })
    );

    this.logger.logProcess('GENERATED LEVEL PATHS', { count: levelPaths.length });
    return levelPaths;
  }

  /**
   * Group users by position
   */
  groupUsersByPosition(userPositions: UsersPositionsEntity[]): Map<number, UserEntity[]> {
    const usersByPosition = new Map<number, UserEntity[]>();
    
    userPositions.forEach(up => {
      const users = usersByPosition.get(up.positionId) || [];
      users.push(up.user);
      usersByPosition.set(up.positionId, users);
    });

    this.logger.logProcess('GROUPED USERS BY POSITION', { 
      positions: usersByPosition.size,
      totalUsers: userPositions.length 
    });
    
    return usersByPosition;
  }

  /**
   * Extract unique position IDs from position levels
   */
  extractUniquePositionIds(ciltPositionLevels: CiltMstrPositionLevelsEntity[]): number[] {
    const positionIds = [...new Set(ciltPositionLevels.map(cpl => cpl.positionId))];
    this.logger.logProcess('EXTRACTED UNIQUE POSITION IDS', { count: positionIds.length });
    return positionIds;
  }
} 