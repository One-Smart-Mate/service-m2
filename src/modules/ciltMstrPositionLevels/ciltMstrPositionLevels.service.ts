import { CiltConfigurationPersistence } from '../ciltMstr/cilt-configuration.persistence';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
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
    @InjectRepository(UsersPositionsEntity)
    private readonly usersPositionsRepository: Repository<UsersPositionsEntity>,
    private readonly configurationPersistence: CiltConfigurationPersistence,
  ) {}

  findAll = async () => {
    try {
      return await this.ciltMstrPositionLevelsRepository
        .find({
          where: { deletedAt: IsNull() },
          relations: ['position', 'level', 'ciltMstr', 'ciltMstr.sequences'],
        })
        .then((rows) => rows.filter((row) => this.validAssignment(row)));
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
      return results.filter((result) => this.validAssignment(result));
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
        .then((rows) => rows.filter((row) => this.validAssignment(row)));
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
        .then((rows) => rows.filter((row) => this.validAssignment(row)));
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
        .then((rows) => rows.filter((row) => this.validAssignment(row)));
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
      return positionLevel;
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

  findByLevelIdWithRecentExecutions = async (levelId: number) => {
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const results = await this.ciltMstrPositionLevelsRepository
        .createQueryBuilder('cpl')
        .leftJoinAndSelect('cpl.position', 'position')
        .leftJoinAndSelect('cpl.level', 'level')
        .leftJoinAndSelect('cpl.ciltMstr', 'ciltMstr')
        .leftJoinAndSelect('ciltMstr.sequences', 'sequences')
        .leftJoinAndSelect(
          'sequences.executions',
          'executions',
          'executions.createdAt >= :date',
          {
            date: twentyFourHoursAgo,
          },
        )
        .leftJoinAndSelect('executions.evidences', 'evidences')
        .leftJoinAndSelect('executions.referenceOplSop', 'referenceOplSop')
        .leftJoinAndSelect('executions.remediationOplSop', 'remediationOplSop')
        .where('cpl.levelId = :levelId AND cpl.deletedAt IS NULL', { levelId })
        .getMany();
      return results.filter((result) => this.validAssignment(result));
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findByUserIdWithRecentExecutions = async (userId: number) => {
    try {
      const userPositions = await this.usersPositionsRepository.find({
        where: {
          userId,
          deletedAt: IsNull(),
        },
        select: ['positionId'],
      });

      if (userPositions.length === 0) {
        return [];
      }

      const positionIds = userPositions
        .map((up) => up.positionId)
        .filter((id) => id != null);

      if (positionIds.length === 0) {
        return [];
      }

      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const results = await this.ciltMstrPositionLevelsRepository
        .createQueryBuilder('cpl')
        .leftJoinAndSelect('cpl.position', 'position')
        .leftJoinAndSelect('cpl.level', 'level')
        .leftJoinAndSelect('cpl.ciltMstr', 'ciltMstr')
        .leftJoinAndSelect('ciltMstr.sequences', 'sequences')
        .leftJoinAndSelect(
          'sequences.executions',
          'executions',
          'executions.createdAt >= :date',
          {
            date: twentyFourHoursAgo,
          },
        )
        .leftJoinAndSelect('executions.evidences', 'evidences')
        .leftJoinAndSelect('executions.referenceOplSop', 'referenceOplSop')
        .leftJoinAndSelect('executions.remediationOplSop', 'remediationOplSop')
        .where(
          'cpl.positionId IN (:...positionIds) AND cpl.deletedAt IS NULL',
          { positionIds },
        )
        .getMany();
      return results.filter((result) => this.validAssignment(result));
    } catch (exception) {
      HandleException.exception(exception);
    }
  };
}
