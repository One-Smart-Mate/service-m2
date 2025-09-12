import { Injectable } from '@nestjs/common';
import { CiltMstrEntity } from '../entities/ciltMstr.entity';
import { CiltSequencesEntity } from 'src/modules/ciltSequences/entities/ciltSequences.entity';
import { CiltSequencesExecutionsEntity } from 'src/modules/CiltSequencesExecutions/entities/ciltSequencesExecutions.entity';
import { UsersPositionsEntity } from 'src/modules/users/entities/users.positions.entity';
import { CiltMstrPositionLevelsEntity } from 'src/modules/ciltMstrPositionLevels/entities/ciltMstrPositionLevels.entity';
import { UserEntity } from 'src/modules/users/entities/user.entity';
import { LevelPathInfo } from './cilt-position-level.service';
import { CustomLoggerService } from 'src/common/logger/logger.service';

export interface CiltUserResponse {
  userInfo: {
    id: number;
    name: string;
    email: string;
  };
  positions: PositionWithCilts[];
}

export interface PositionWithCilts {
  id: number;
  name: string;
  siteName: string;
  areaName: string;
  ciltMasters: CiltMasterWithSequences[];
}

export interface CiltMasterWithSequences {
  id: number;
  ciltName: string;
  sequences: SequenceWithExecutions[];
  levelId?: number;
  route?: string;
}

export interface SequenceWithExecutions {
  id: number;
  secuenceName: string;
  executions: CiltSequencesExecutionsEntity[];
}

export interface CiltSiteResponse {
  siteId: number;
  date: string;
  executions: CiltSequencesExecutionsEntity[];
  total: number;
}

@Injectable()
export class CiltQueryBuilderService {
  constructor(
    private readonly logger: CustomLoggerService,
  ) {}

  /**
   * Build the response for user queries
   */
  buildUserCiltResponse(
    user: UserEntity,
    userPositions: UsersPositionsEntity[],
    validCiltPositionLevels: CiltMstrPositionLevelsEntity[],
    ciltSequences: CiltSequencesEntity[],
    allExecutions: CiltSequencesExecutionsEntity[],
    levelPaths: LevelPathInfo[]
  ): CiltUserResponse {
    this.logger.logProcess('BUILDING USER CILT RESPONSE', { 
      userId: user.id, 
      positionsCount: userPositions.length 
    });

    // Group sequences and executions
    const { sequencesByMaster, executionsBySequence } = this.groupSequencesAndExecutions(
      ciltSequences, 
      allExecutions
    );

    const positions = this.buildPositionsWithCilts(
      userPositions,
      validCiltPositionLevels,
      sequencesByMaster,
      executionsBySequence,
      levelPaths
    );

    const response: CiltUserResponse = {
      userInfo: { 
        id: user.id, 
        name: user.name, 
        email: user.email 
      },
      positions,
    };

    this.logger.logProcess('USER CILT RESPONSE BUILT', { 
      userId: user.id,
      positionsWithCilts: positions.length 
    });

    return response;
  }

  /**
   * Build the response for site queries
   */
  buildSiteCiltResponse(
    siteId: number,
    date: string,
    allExecutions: CiltSequencesExecutionsEntity[],
    levelPaths: LevelPathInfo[]
  ): CiltSiteResponse {
    this.logger.logProcess('BUILDING SITE CILT RESPONSE', { 
      siteId, 
      date,
      executionsCount: allExecutions.length 
    });

    const executionsWithLevelInfo = allExecutions.map(exec => {
      const levelInfo = levelPaths.find(lp => lp.ciltMstrId === exec.ciltId);
      return {
        ...exec,
        levelId: levelInfo?.levelId,
        route: levelInfo?.route
      };
    });

    const response: CiltSiteResponse = {
      siteId,
      date,
      executions: executionsWithLevelInfo,
      total: allExecutions.length
    };

    this.logger.logProcess('SITE CILT RESPONSE BUILT', { 
      siteId,
      totalExecutions: response.total 
    });

    return response;
  }

  /**
   * Extract unique CILT masters from position levels
   */
  extractUniqueCiltMasters(validCiltPositionLevels: CiltMstrPositionLevelsEntity[]): CiltMstrEntity[] {
    const ciltMasters = Array.from(
      new Map(validCiltPositionLevels.map(cpl => [cpl.ciltMstr.id, cpl.ciltMstr])).values()
    );
    
    this.logger.logProcess('EXTRACTED UNIQUE CILT MASTERS', { count: ciltMasters.length });
    return ciltMasters;
  }

  /**
   * Group sequences by master and executions by sequence
   */
  private groupSequencesAndExecutions(
    ciltSequences: CiltSequencesEntity[],
    allExecutions: CiltSequencesExecutionsEntity[]
  ): {
    sequencesByMaster: Map<number, CiltSequencesEntity[]>;
    executionsBySequence: Map<number, CiltSequencesExecutionsEntity[]>;
  } {
    const sequencesByMaster = new Map<number, CiltSequencesEntity[]>();
    ciltSequences.forEach(seq => {
      const list = sequencesByMaster.get(seq.ciltMstrId) ?? [];
      list.push(seq);
      sequencesByMaster.set(seq.ciltMstrId, list);
    });

    const executionsBySequence = new Map<number, CiltSequencesExecutionsEntity[]>();
    allExecutions.forEach(exec => {
      const list = executionsBySequence.get(exec.ciltSecuenceId) ?? [];
      list.push(exec);
      executionsBySequence.set(exec.ciltSecuenceId, list);
    });

    // Sort executions within each sequence by schedule date
    executionsBySequence.forEach((executions) => {
      executions.sort((a, b) => {
        const dateA = a.secuenceSchedule ? new Date(a.secuenceSchedule).getTime() : 0;
        const dateB = b.secuenceSchedule ? new Date(b.secuenceSchedule).getTime() : 0;
        return dateA - dateB;
      });
    });

    this.logger.logProcess('GROUPED SEQUENCES AND EXECUTIONS', {
      mastersWithSequences: sequencesByMaster.size,
      sequencesWithExecutions: executionsBySequence.size
    });

    return { sequencesByMaster, executionsBySequence };
  }

  /**
   * Build positions with their associated CILTs
   */
  private buildPositionsWithCilts(
    userPositions: UsersPositionsEntity[],
    validCiltPositionLevels: CiltMstrPositionLevelsEntity[],
    sequencesByMaster: Map<number, CiltSequencesEntity[]>,
    executionsBySequence: Map<number, CiltSequencesExecutionsEntity[]>,
    levelPaths: LevelPathInfo[]
  ): PositionWithCilts[] {
    return userPositions.map(up => {
      const masters = validCiltPositionLevels
        .filter(cpl => cpl.positionId === up.position.id)
        .map(cpl => this.buildCiltMasterWithSequences(
          cpl,
          sequencesByMaster,
          executionsBySequence,
          levelPaths
        ))
        .filter(master => master !== null);

      return {
        id: up.position.id,
        name: up.position.name,
        siteName: up.position.siteName,
        areaName: up.position.areaName,
        ciltMasters: masters,
      };
    });
  }

  /**
   * Build a CILT master with its sequences
   */
  private buildCiltMasterWithSequences(
    cpl: CiltMstrPositionLevelsEntity,
    sequencesByMaster: Map<number, CiltSequencesEntity[]>,
    executionsBySequence: Map<number, CiltSequencesExecutionsEntity[]>,
    levelPaths: LevelPathInfo[]
  ): CiltMasterWithSequences | null {
    const master = cpl.ciltMstr;
    const levelInfo = levelPaths.find(lp => lp.ciltMstrId === master.id);
    
    const sequencesWithExecutions = (sequencesByMaster.get(master.id) ?? [])
      .map(seq => this.buildSequenceWithExecutions(seq, executionsBySequence))
      .filter(seq => seq !== null);

    // Only include masters that have sequences with executions
    if (sequencesWithExecutions.length === 0) {
      return null;
    }

    return {
      ...master,
      sequences: sequencesWithExecutions,
      levelId: levelInfo?.levelId,
      route: levelInfo?.route
    };
  }

  /**
   * Build a sequence with its executions
   */
  private buildSequenceWithExecutions(
    seq: CiltSequencesEntity,
    executionsBySequence: Map<number, CiltSequencesExecutionsEntity[]>
  ): SequenceWithExecutions | null {
    // Get executions (already sorted by secuenceSchedule in groupSequencesAndExecutions)
    const executions = executionsBySequence.get(seq.id) ?? [];
    
    // Exclude sequences that don't have executions
    if (executions.length === 0) {
      return null;
    }
    
    const { ...seqFields } = seq as any;
    return { ...seqFields, executions };
  }
} 