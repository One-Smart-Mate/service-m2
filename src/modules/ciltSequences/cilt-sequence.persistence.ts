import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager, IsNull } from 'typeorm';
import {
  NotFoundCustomException,
  NotFoundCustomExceptionType,
} from 'src/common/exceptions/types/notFound.exception';
import { stringConstants } from 'src/utils/string.constant';
import { CiltFrequenciesEntity } from '../ciltFrequencies/entities/ciltFrequencies.entity';
import { CiltMstrEntity } from '../ciltMstr/entities/ciltMstr.entity';
import { CiltTypesEntity } from '../ciltTypes/entities/ciltTypes.entity';
import { OplMstr } from '../oplMstr/entities/oplMstr.entity';
import { SiteEntity } from '../site/entities/site.entity';
import { CiltSequencesEntity } from './entities/ciltSequences.entity';
import { CreateCiltSequenceDTO } from './models/dto/createCiltSequence.dto';
import { UpdateSequenceOrderDTO } from './models/dto/update-order.dto';
import { UpdateCiltSequenceDTO } from './models/dto/updateCiltSequence.dto';

type SequenceInput = CreateCiltSequenceDTO | UpdateCiltSequenceDTO;

interface ValidatedSequenceRelations {
  site: SiteEntity;
  master: CiltMstrEntity;
  frequency?: CiltFrequenciesEntity;
  ciltType?: CiltTypesEntity;
}

@Injectable()
export class CiltSequencePersistence {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  create(dto: CreateCiltSequenceDTO) {
    if (!dto.siteId || !dto.ciltMstrId) {
      throw new BadRequestException('siteId and ciltMstrId are required');
    }

    return this.dataSource.transaction(async (manager) => {
      const relations = await this.validateRelations(manager, dto, dto.siteId);
      const repository = manager.getRepository(CiltSequencesEntity);
      const lastSequence = await repository.findOne({
        where: { ciltMstrId: dto.ciltMstrId, deletedAt: IsNull() },
        order: { order: 'DESC' },
        lock: { mode: 'pessimistic_write' },
      });
      const sequence = repository.create(this.sanitize(dto, relations));
      sequence.order = (lastSequence?.order ?? 0) + 1;
      return repository.save(sequence);
    });
  }

  update(dto: UpdateCiltSequenceDTO) {
    return this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(CiltSequencesEntity);
      const sequence = await repository.findOne({
        where: { id: dto.id, deletedAt: IsNull() },
        lock: { mode: 'pessimistic_write' },
      });
      if (!sequence) {
        throw new NotFoundCustomException(
          NotFoundCustomExceptionType.CILT_SEQUENCES,
        );
      }
      if (
        dto.siteId !== undefined &&
        Number(dto.siteId) !== Number(sequence.siteId)
      ) {
        throw new BadRequestException(
          'A CILT sequence cannot be moved to another site',
        );
      }
      if (
        dto.ciltMstrId !== undefined &&
        Number(dto.ciltMstrId) !== Number(sequence.ciltMstrId)
      ) {
        throw new BadRequestException(
          'A CILT sequence cannot be moved to another master',
        );
      }

      const normalized = {
        ...dto,
        siteId: sequence.siteId,
        ciltMstrId: sequence.ciltMstrId,
      };
      const relations = await this.validateRelations(
        manager,
        normalized,
        sequence.siteId,
      );
      Object.assign(sequence, this.sanitize(normalized, relations));
      return repository.save(sequence);
    });
  }

  updateOrder(dto: UpdateSequenceOrderDTO) {
    return this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(CiltSequencesEntity);
      const sequence = await repository.findOne({
        where: { id: dto.sequenceId, deletedAt: IsNull() },
        lock: { mode: 'pessimistic_write' },
      });
      if (!sequence) {
        throw new NotFoundCustomException(
          NotFoundCustomExceptionType.CILT_SEQUENCES,
        );
      }
      if (sequence.order === dto.newOrder) {
        return sequence;
      }

      const target = await repository.findOne({
        where: {
          ciltMstrId: sequence.ciltMstrId,
          order: dto.newOrder,
          deletedAt: IsNull(),
        },
        lock: { mode: 'pessimistic_write' },
      });
      const previousOrder = sequence.order;
      sequence.order = dto.newOrder;
      if (target) {
        target.order = previousOrder;
        await repository.save([target, sequence]);
      } else {
        await repository.save(sequence);
      }
      return sequence;
    });
  }

  private async validateRelations(
    manager: EntityManager,
    dto: SequenceInput,
    siteId: number,
  ): Promise<ValidatedSequenceRelations> {
    const site = await manager.getRepository(SiteEntity).findOne({
      where: {
        id: siteId,
        status: stringConstants.activeStatus,
        deletedAt: IsNull(),
      },
    });
    if (!site) {
      throw new NotFoundCustomException(NotFoundCustomExceptionType.SITE);
    }

    const master = await manager.getRepository(CiltMstrEntity).findOne({
      where: { id: dto.ciltMstrId, siteId, deletedAt: IsNull() },
    });
    if (!master) {
      throw new NotFoundCustomException(NotFoundCustomExceptionType.CILT_MSTR);
    }

    const frequency = dto.frecuencyId
      ? await manager.getRepository(CiltFrequenciesEntity).findOne({
          where: {
            id: dto.frecuencyId,
            siteId,
            status: stringConstants.activeStatus,
            deletedAt: IsNull(),
          },
        })
      : undefined;
    if (dto.frecuencyId && !frequency) {
      throw new NotFoundCustomException(
        NotFoundCustomExceptionType.CILT_FREQUENCIES,
      );
    }

    const ciltType = dto.ciltTypeId
      ? await manager.getRepository(CiltTypesEntity).findOne({
          where: {
            id: dto.ciltTypeId,
            siteId,
            status: stringConstants.activeStatus,
            deletedAt: IsNull(),
          },
        })
      : undefined;
    if (dto.ciltTypeId && !ciltType) {
      throw new NotFoundCustomException(NotFoundCustomExceptionType.CILT_TYPES);
    }

    await this.validateOpl(manager, dto.referenceOplSopId, siteId);
    await this.validateOpl(manager, dto.remediationOplSopId, siteId);
    return { site, master, frequency, ciltType };
  }

  private async validateOpl(
    manager: EntityManager,
    oplId: number | undefined,
    siteId: number,
  ) {
    if (!oplId) {
      return;
    }
    const opl = await manager.getRepository(OplMstr).findOne({
      where: { id: oplId, siteId, deletedAt: IsNull() },
    });
    if (!opl) {
      throw new NotFoundCustomException(NotFoundCustomExceptionType.OPL_MSTR);
    }
  }

  private sanitize(dto: SequenceInput, relations: ValidatedSequenceRelations) {
    const data: Record<string, any> = { ...dto };
    delete data.id;
    delete data.siteName;
    delete data.ciltMstrName;
    delete data.frecuencyCode;
    delete data.ciltTypeName;
    delete data.order;
    return {
      ...data,
      siteId: relations.site.id,
      siteName: relations.site.name,
      ciltMstrId: relations.master.id,
      ciltMstrName: relations.master.ciltName,
      frecuencyId: relations.frequency?.id ?? data.frecuencyId,
      frecuencyCode: relations.frequency?.frecuencyCode ?? null,
      ciltTypeId: relations.ciltType?.id ?? data.ciltTypeId,
      ciltTypeName: relations.ciltType?.name ?? null,
    };
  }
}
