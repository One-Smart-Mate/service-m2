import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, IsNull } from 'typeorm';
import {
  NotFoundCustomException,
  NotFoundCustomExceptionType,
} from 'src/common/exceptions/types/notFound.exception';
import { OplMstr } from '../oplMstr/entities/oplMstr.entity';
import { OplDetailsEntity } from './entities/oplDetails.entity';
import { CreateOplDetailsDTO } from './models/dto/createOplDetails.dto';
import { UpdateOplDetailOrderDTO } from './models/dto/update-order.dto';
import { UpdateOplDetailsDTO } from './models/dto/updateOplDetails.dto';

@Injectable()
export class OplDetailPersistence {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  create(dto: CreateOplDetailsDTO) {
    return this.dataSource.transaction(async (manager) => {
      const opl = await manager.getRepository(OplMstr).findOne({
        where: { id: dto.oplId, deletedAt: IsNull() },
        lock: { mode: 'pessimistic_read' },
      });
      if (!opl) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.OPL_MSTR);
      }
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
          order: (lastDetail?.order ?? 0) + 1,
        }),
      );
    });
  }

  update(dto: UpdateOplDetailsDTO) {
    return this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(OplDetailsEntity);
      const detail = await repository.findOne({
        where: { id: dto.id, deletedAt: IsNull() },
        lock: { mode: 'pessimistic_write' },
      });
      if (!detail) {
        throw new NotFoundCustomException(
          NotFoundCustomExceptionType.OPL_DETAILS,
        );
      }
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
    return this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(OplDetailsEntity);
      const detail = await repository.findOne({
        where: { id: dto.detailId, deletedAt: IsNull() },
        lock: { mode: 'pessimistic_write' },
      });
      if (!detail) {
        throw new NotFoundCustomException(
          NotFoundCustomExceptionType.OPL_DETAILS,
        );
      }
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
        await repository.save([target, detail]);
      } else {
        await repository.save(detail);
      }
      return detail;
    });
  }
}
