import { CiltConfigurationPersistence } from '../ciltMstr/cilt-configuration.persistence';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { sanitizeExecutionRelations } from '../CiltSequencesExecutions/cilt-execution-relations.policy';
import { CiltMstrPositionLevelsEntity } from './entities/ciltMstrPositionLevels.entity';
import { CreateCiltMstrPositionLevelsDto } from './model/create.ciltMstrPositionLevels.dto';
import { UpdateCiltMstrPositionLevelsDto } from './model/update.ciltMstrPositionLevels.dto';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';
import {
  NotFoundCustomException,
  NotFoundCustomExceptionType,
} from 'src/common/exceptions/types/notFound.exception';
import { UsersPositionsEntity } from '../users/entities/users.positions.entity';

@Injectable()
export class CiltMstrPositionLevelsService {
  constructor(
    @InjectRepository(CiltMstrPositionLevelsEntity)
    private readonly ciltMstrPositionLevelsRepository: Repository<CiltMstrPositionLevelsEntity>,
    private readonly configurationPersistence: CiltConfigurationPersistence,
  ) {}

  findAll = async () => {
    try {
      return await this.ciltMstrPositionLevelsRepository
        .find({
          where: { deletedAt: IsNull() },
          relations: ['position', 'level', 'ciltMstr', 'ciltMstr.sequences'],
        })
        .then((rows) => this.sanitizeAssignments(rows));
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findBySiteId = async (siteId: number) => {
    try {
      const results = await this.ciltMstrPositionLevelsRepository.find({
        where: {
          siteId,
          deletedAt: IsNull(),
        },
        relations: ['position', 'level', 'ciltMstr', 'ciltMstr.sequences'],
      });
      return this.sanitizeAssignments(results);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findByCiltMstrId = async (ciltMstrId: number) => {
    try {
      return await this.ciltMstrPositionLevelsRepository
        .find({
          where: {
            ciltMstrId,
            deletedAt: IsNull(),
          },
          relations: ['position', 'level', 'ciltMstr', 'ciltMstr.sequences'],
        })
        .then((rows) => this.sanitizeAssignments(rows));
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findByPositionId = async (positionId: number) => {
    try {
      return await this.ciltMstrPositionLevelsRepository
        .find({
          where: {
            positionId,
            deletedAt: IsNull(),
          },
          relations: ['position', 'level', 'ciltMstr', 'ciltMstr.sequences'],
        })
        .then((rows) => this.sanitizeAssignments(rows));
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findByLevelId = async (levelId: number) => {
    try {
      return await this.ciltMstrPositionLevelsRepository
        .find({
          where: {
            levelId,
            deletedAt: IsNull(),
          },
          relations: ['position', 'level', 'ciltMstr', 'ciltMstr.sequences'],
        })
        .then((rows) => this.sanitizeAssignments(rows));
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findById = async (id: number) => {
    try {
      const positionLevel = await this.ciltMstrPositionLevelsRepository.findOne(
        {
          where: {
            id,
            deletedAt: IsNull(),
          },
          relations: ['position', 'level', 'ciltMstr', 'ciltMstr.sequences'],
        },
      );
      if (!positionLevel || !this.validAssignment(positionLevel)) {
        throw new NotFoundCustomException(
          NotFoundCustomExceptionType.CILT_MSTR_POSITION_LEVELS,
        );
      }
      return this.sanitizeAssignments([positionLevel])[0];
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  private validAssignment(row: CiltMstrPositionLevelsEntity): boolean {
    return [row.position, row.level, row.ciltMstr].every(
      (record) =>
        record &&
        !record.deletedAt &&
        Number(record.siteId) === Number(row.siteId),
    );
  }

  create = async (input: CreateCiltMstrPositionLevelsDto) => {
    try {
      return await this.configurationPersistence.createAssignment(input);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  update = async (input: UpdateCiltMstrPositionLevelsDto) => {
    try {
      return await this.configurationPersistence.updateAssignment(input);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  remove = async (id: number) => {
    try {
      const positionLevel = await this.findById(id);
      if (!positionLevel || !this.validAssignment(positionLevel)) {
        throw new NotFoundCustomException(
          NotFoundCustomExceptionType.CILT_MSTR_POSITION_LEVELS,
        );
      }
      await this.ciltMstrPositionLevelsRepository.softDelete(id);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  async softDelete(id: number) {
    try {
      const positionLevel = await this.findById(id);
      if (!positionLevel || !this.validAssignment(positionLevel)) {
        throw new NotFoundCustomException(
          NotFoundCustomExceptionType.CILT_MSTR_POSITION_LEVELS,
        );
      }
      return await this.ciltMstrPositionLevelsRepository.softDelete(id);
    } catch (exception) {
      HandleException.exception(exception);
    }
  }

  private recentExecutionsQuery() {
    return this.ciltMstrPositionLevelsRepository
      .createQueryBuilder('cpl')
      .innerJoinAndSelect(
        'cpl.position',
        'position',
        "position.siteId = cpl.siteId AND position.status = 'A' AND position.deletedAt IS NULL",
      )
      .innerJoinAndSelect(
        'cpl.level',
        'level',
        "level.siteId = cpl.siteId AND level.status = 'A' AND level.deletedAt IS NULL",
      )
      .innerJoinAndSelect(
        'cpl.ciltMstr',
        'ciltMstr',
        "ciltMstr.siteId = cpl.siteId AND ciltMstr.status = 'A' AND ciltMstr.deletedAt IS NULL",
      )
      .leftJoinAndSelect(
        'ciltMstr.sequences',
        'sequences',
        'sequences.siteId = cpl.siteId AND sequences.deletedAt IS NULL',
      )
      .leftJoinAndSelect(
        'sequences.executions',
        'executions',
        'executions.siteId = cpl.siteId AND executions.ciltId = cpl.ciltMstrId AND executions.deletedAt IS NULL AND executions.createdAt >= :date',
        { date: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      )
      .leftJoinAndSelect(
        'executions.evidences',
        'evidences',
        'evidences.siteId = executions.siteId AND evidences.ciltId = executions.ciltId AND evidences.positionId = executions.positionId AND evidences.deletedAt IS NULL',
      )
      .leftJoinAndSelect(
        'executions.referenceOplSop',
        'referenceOplSop',
        'referenceOplSop.siteId = executions.siteId AND referenceOplSop.deletedAt IS NULL',
      )
      .leftJoinAndSelect(
        'executions.remediationOplSop',
        'remediationOplSop',
        'remediationOplSop.siteId = executions.siteId AND remediationOplSop.deletedAt IS NULL',
      )
      .where("cpl.deletedAt IS NULL AND cpl.status = 'A'");
  }

  private sanitizeAssignments(rows: CiltMstrPositionLevelsEntity[]) {
    return rows
      .filter((row) => this.validAssignment(row))
      .map((row) => {
        row.ciltMstr.sequences = (row.ciltMstr.sequences ?? []).filter(
          (sequence) =>
            !sequence.deletedAt &&
            Number(sequence.siteId) === Number(row.siteId) &&
            Number(sequence.ciltMstrId) === Number(row.ciltMstrId),
        );
        for (const sequence of row.ciltMstr.sequences ?? []) {
          if (sequence.executions) {
            sequence.executions = sequence.executions.map(
              sanitizeExecutionRelations,
            );
          }
        }
        return row;
      });
  }

  findByLevelIdWithRecentExecutions = async (levelId: number) => {
    try {
      const rows = await this.recentExecutionsQuery()
        .andWhere('cpl.levelId = :levelId', { levelId })
        .getMany();
      return this.sanitizeAssignments(rows);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findByUserIdWithRecentExecutions = async (
    userId: number,
    sessionSiteId?: number,
  ) => {
    try {
      // Authorize the assignments in the same query that loads the graph.
      // Old position links cannot grant access after a membership is revoked.
      const query = this.recentExecutionsQuery()
        .innerJoin(
          UsersPositionsEntity,
          'assignment',
          'assignment.positionId = cpl.positionId AND assignment.siteId = cpl.siteId AND assignment.userId = :userId AND assignment.deletedAt IS NULL',
          { userId },
        )
        .innerJoin(
          'assignment.user',
          'assignedUser',
          "assignedUser.status = 'A' AND assignedUser.deletedAt IS NULL",
        )
        .innerJoin(
          'assignedUser.userHasSites',
          'membership',
          "membership.status = 'A' AND membership.deletedAt IS NULL",
        )
        .innerJoin(
          'membership.site',
          'site',
          "site.id = cpl.siteId AND site.status = 'A' AND site.deletedAt IS NULL",
        );
      if (sessionSiteId !== undefined) {
        query.andWhere('cpl.siteId = :sessionSiteId', { sessionSiteId });
      }
      const rows = await query.getMany();
      return this.sanitizeAssignments(rows);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };
}
