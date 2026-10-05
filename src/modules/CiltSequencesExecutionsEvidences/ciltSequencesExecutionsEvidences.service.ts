import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager, IsNull } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { CiltSequencesExecutionsEntity } from '../CiltSequencesExecutions/entities/ciltSequencesExecutions.entity';
import {
  retryDatabaseTransaction,
  positiveDatabaseId,
} from '../../common/database/site-transaction';
import { CiltSequencesExecutionsEvidencesEntity } from './entities/ciltSequencesExecutionsEvidences.entity';
import { CreateCiltSequencesEvidenceDTO } from './models/dtos/createCiltSequencesEvidence.dto';
import { UpdateCiltSequencesEvidenceDTO } from './models/dtos/updateCiltSequencesEvidence.dto';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';
import {
  NotFoundCustomException,
  NotFoundCustomExceptionType,
} from 'src/common/exceptions/types/notFound.exception';

@Injectable()
export class CiltSequencesExecutionsEvidencesService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(CiltSequencesExecutionsEvidencesEntity)
    private readonly ciltSequencesExecutionsEvidencesRepository: Repository<CiltSequencesExecutionsEvidencesEntity>,
  ) {}

  findAll = async () => {
    try {
      return await this.ciltSequencesExecutionsEvidencesRepository.find();
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findBySiteId = async (siteId: number) => {
    try {
      return await this.ciltSequencesExecutionsEvidencesRepository.find({
        where: { siteId },
      });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findByPositionId = async (positionId: number) => {
    try {
      return await this.ciltSequencesExecutionsEvidencesRepository.find({
        where: { positionId },
      });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findByCiltId = async (ciltId: number) => {
    try {
      return await this.ciltSequencesExecutionsEvidencesRepository.find({
        where: { ciltId },
      });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findById = async (id: number) => {
    try {
      const ciltEvidence =
        await this.ciltSequencesExecutionsEvidencesRepository.findOne({
          where: { id },
        });
      if (!ciltEvidence) {
        throw new NotFoundCustomException(
          NotFoundCustomExceptionType.CILT_SEQUENCES_EXECUTIONS_EVIDENCES,
        );
      }
      return ciltEvidence;
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  create = async (dto: CreateCiltSequencesEvidenceDTO) => {
    return this.withExecution(
      dto.ciltSequencesExecutionsId,
      async (manager, execution) => {
        const repository = manager.getRepository(
          CiltSequencesExecutionsEvidencesEntity,
        );
        const type = dto.type ?? 'INITIAL';
        if (
          !dto.evidenceUrl ||
          dto.evidenceUrl.length > 500 ||
          !['INITIAL', 'FINAL'].includes(type)
        )
          throw new BadRequestException(
            'Valid evidence URL and type are required',
          );
        const date = new Date(dto.createdAt);
        if (!Number.isFinite(date.getTime()))
          throw new BadRequestException('Invalid evidence date');
        date.setMilliseconds(0);
        const existing = await repository.findOne({
          where: {
            ciltSequencesExecutionsId: execution.id,
            evidenceUrl: dto.evidenceUrl,
            type,
            createdAt: date,
            deletedAt: IsNull(),
          },
        });
        if (existing) return existing;
        this.assertMutable(execution, type);
        return repository.save(
          repository.create({
            siteId: execution.siteId,
            positionId: execution.positionId,
            ciltId: execution.ciltId,
            ciltSequencesExecutionsId: execution.id,
            evidenceUrl: dto.evidenceUrl,
            type,
            createdAt: date,
          }),
        );
      },
    );
  };

  update = async (dto: UpdateCiltSequencesEvidenceDTO) => {
    return this.withEvidence(dto.id, async (manager, execution, evidence) => {
      this.assertMutable(execution, dto.type ?? evidence.type ?? 'INITIAL');
      for (const key of [
        'siteId',
        'positionId',
        'ciltId',
        'ciltSequencesExecutionsId',
      ])
        if (
          dto[key] !== undefined &&
          Number(dto[key]) !== Number(evidence[key])
        )
          throw new BadRequestException('Evidence ownership is immutable');
      if (
        dto.evidenceUrl !== undefined &&
        (!dto.evidenceUrl || dto.evidenceUrl.length > 500)
      )
        throw new BadRequestException('Invalid evidence URL');
      return manager
        .getRepository(CiltSequencesExecutionsEvidencesEntity)
        .save({
          ...evidence,
          ...(dto.evidenceUrl === undefined
            ? {}
            : { evidenceUrl: dto.evidenceUrl }),
          ...(dto.type === undefined ? {} : { type: dto.type }),
          updatedAt: new Date(),
        });
    });
  };

  delete = async (id: number) => {
    return this.withEvidence(id, (manager, execution, evidence) => {
      this.assertMutable(execution, evidence.type ?? 'INITIAL');
      return manager
        .getRepository(CiltSequencesExecutionsEvidencesEntity)
        .softDelete(evidence.id);
    });
  };

  private assertMutable(
    execution: CiltSequencesExecutionsEntity,
    type: string,
  ) {
    if (execution.status !== 'A' || execution.deletedAt)
      throw new ConflictException(
        'Evidence can only change during an active execution',
      );
    if (type === 'FINAL' && !execution.secuenceStart)
      throw new ConflictException(
        'Final evidence requires a started execution',
      );
  }

  private withExecution<T>(
    rawId: number,
    work: (
      manager: EntityManager,
      execution: CiltSequencesExecutionsEntity,
    ) => Promise<T>,
  ) {
    const id = positiveDatabaseId(rawId);
    return retryDatabaseTransaction(this.dataSource, async (manager) => {
      const execution = await manager.findOne(CiltSequencesExecutionsEntity, {
        where: { id, deletedAt: IsNull() },
        lock: { mode: 'pessimistic_write' },
      });
      if (!execution) throw new NotFoundException('Execution not found');
      return work(manager, execution);
    });
  }

  private async withEvidence<T>(
    id: number,
    work: (
      manager: EntityManager,
      execution: CiltSequencesExecutionsEntity,
      evidence: CiltSequencesExecutionsEvidencesEntity,
    ) => Promise<T>,
  ) {
    const snapshot = await this.findById(positiveDatabaseId(id));
    return this.withExecution(
      snapshot.ciltSequencesExecutionsId,
      async (manager, execution) => {
        const evidence = await manager.findOne(
          CiltSequencesExecutionsEvidencesEntity,
          {
            where: {
              id: snapshot.id,
              ciltSequencesExecutionsId: execution.id,
              deletedAt: IsNull(),
            },
            lock: { mode: 'pessimistic_write' },
          },
        );
        if (!evidence) throw new NotFoundException('Evidence not found');
        return work(manager, execution, evidence);
      },
    );
  }
}
