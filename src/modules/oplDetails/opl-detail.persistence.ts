import {
  validateOrder,
  positiveDatabaseId,
} from '../../common/database/site-transaction';
import { withLockedOpl } from '../oplMstr/opl-transaction';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, IsNull } from 'typeorm';
import {
  NotFoundCustomException,
  NotFoundCustomExceptionType,
} from 'src/common/exceptions/types/notFound.exception';
import { OplDetailsEntity } from './entities/oplDetails.entity';
import { CreateOplDetailsDTO } from './models/dto/createOplDetails.dto';
import { UpdateOplDetailOrderDTO } from './models/dto/update-order.dto';
import { UpdateOplDetailsDTO } from './models/dto/updateOplDetails.dto';

@Injectable()
export class OplDetailPersistence {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  create(dto: CreateOplDetailsDTO) {
    return withLockedOpl(this.dataSource, dto.oplId, async (manager, opl) => {
      const repository = manager.getRepository(OplDetailsEntity);
      const lastDetail = await repository.findOne({
        where: { oplId: opl.id, deletedAt: IsNull() },
        order: { order: 'DESC' },
        lock: { mode: 'pessimistic_write' },
      });
      const clientData = { ...dto };
      delete clientData.siteId;
      delete clientData.order;
      return repository.save(
        repository.create({
          ...clientData,
          siteId: opl.siteId,
          oplId: opl.id,
          order: validateOrder(Number(lastDetail?.order ?? 0) + 1),
        }),
      );
    });
  }

  update(dto: UpdateOplDetailsDTO) {
    return this.withDetail(dto.id, async (repository, detail) => {
      if (
        dto.oplId !== undefined &&
        Number(dto.oplId) !== Number(detail.oplId)
      ) {
        throw new BadRequestException(
          'An OPL detail cannot be moved to another OPL',
        );
      }

      const changes = { ...dto };
      delete changes.id;
      delete changes.oplId;
      delete changes.order;
      Object.assign(detail, changes);
      return repository.save(detail);
    });
  }

  updateOrder(dto: UpdateOplDetailOrderDTO) {
    validateOrder(dto.newOrder);
    return this.withDetail(dto.detailId, async (repository, detail) => {
      if (detail.order === dto.newOrder) {
        return detail;
      }

      const target = await repository.findOne({
        where: {
          oplId: detail.oplId,
          order: dto.newOrder,
          deletedAt: IsNull(),
        },
        lock: { mode: 'pessimistic_write' },
      });
      const previousOrder = detail.order;
      detail.order = dto.newOrder;
      if (target) {
        target.order = previousOrder;
        await repository.update(target.id, { order: previousOrder });
        await repository.update(detail.id, { order: dto.newOrder });
      } else {
        await repository.update(detail.id, { order: dto.newOrder });
      }
      return detail;
    });
  }
  delete(id: number) {
    return this.withDetail(id, (repository, detail) =>
      repository.softDelete(detail.id),
    );
  }

  private async withDetail<T>(
    rawId: number,
    work: (
      repository: import('typeorm').Repository<OplDetailsEntity>,
      detail: OplDetailsEntity,
    ) => Promise<T>,
  ): Promise<T> {
    const id = positiveDatabaseId(rawId);
    const snapshot = await this.dataSource
      .getRepository(OplDetailsEntity)
      .findOne({ where: { id, deletedAt: IsNull() } });
    if (!snapshot)
      throw new NotFoundCustomException(
        NotFoundCustomExceptionType.OPL_DETAILS,
      );
    return withLockedOpl(this.dataSource, snapshot.oplId, async (manager) => {
      const repository = manager.getRepository(OplDetailsEntity);
      const detail = await repository.findOne({
        where: { id, oplId: snapshot.oplId, deletedAt: IsNull() },
        lock: { mode: 'pessimistic_write' },
      });
      if (!detail)
        throw new NotFoundCustomException(
          NotFoundCustomExceptionType.OPL_DETAILS,
        );
      return work(repository, detail);
    });
  }
}
