import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager, IsNull } from 'typeorm';
import {
  NotFoundCustomException,
  NotFoundCustomExceptionType,
} from 'src/common/exceptions/types/notFound.exception';
import { stringConstants } from 'src/utils/string.constant';
import { UserEntity } from '../users/entities/user.entity';
import { OplTypes } from '../oplTypes/entities/oplTypes.entity';
import { OplMstr } from './entities/oplMstr.entity';
import { CreateOplMstrDTO } from './models/dto/createOplMstr.dto';
import { UpdateOplMstrOrderDTO } from './models/dto/update-order.dto';
import { UpdateOplMstrDTO } from './models/dto/updateOplMstr.dto';

@Injectable()
export class OplMasterPersistence {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  create(dto: CreateOplMstrDTO, creatorId: number) {
    return this.dataSource.transaction(async (manager) => {
      const creator = await this.findActiveCreator(manager, creatorId);
      const repository = manager.getRepository(OplMstr);
      const lastOpl = await repository.findOne({
        where: { siteId: dto.siteId, deletedAt: IsNull() },
        order: { order: 'DESC' },
        lock: { mode: 'pessimistic_write' },
      });
      const clientData = { ...dto };
      delete clientData.creatorId;
      delete clientData.creatorName;
      const opl = repository.create({
        ...clientData,
        creatorId: creator.id,
        creatorName: creator.name,
        order: (lastOpl?.order ?? 0) + 1,
      });
      await this.applyType(manager, opl, dto.oplTypeId);
      return repository.save(opl);
    });
  }

  update(dto: UpdateOplMstrDTO) {
    return this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(OplMstr);
      const opl = await repository.findOne({
        where: { id: dto.id, deletedAt: IsNull() },
        lock: { mode: 'pessimistic_write' },
      });
      if (!opl) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.OPL_MSTR);
      }
      if (
        dto.siteId !== undefined &&
        Number(dto.siteId) !== Number(opl.siteId)
      ) {
        throw new BadRequestException('An OPL cannot be moved to another site');
      }

      const changes = { ...dto };
      delete changes.id;
      delete changes.siteId;
      delete changes.creatorId;
      delete changes.creatorName;
      Object.assign(opl, changes);
      await this.applyType(manager, opl, dto.oplTypeId);
      return repository.save(opl);
    });
  }

  updateOrder(dto: UpdateOplMstrOrderDTO) {
    return this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(OplMstr);
      const opl = await repository.findOne({
        where: { id: dto.oplId, deletedAt: IsNull() },
        lock: { mode: 'pessimistic_write' },
      });
      if (!opl) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.OPL_MSTR);
      }
      if (opl.order === dto.newOrder) {
        return opl;
      }

      const target = await repository.findOne({
        where: { siteId: opl.siteId, order: dto.newOrder, deletedAt: IsNull() },
        lock: { mode: 'pessimistic_write' },
      });
      const previousOrder = opl.order;
      opl.order = dto.newOrder;
      if (target) {
        target.order = previousOrder;
        await repository.save([target, opl]);
      } else {
        await repository.save(opl);
      }
      return opl;
    });
  }

  private async findActiveCreator(manager: EntityManager, creatorId: number) {
    const creator = await manager.getRepository(UserEntity).findOne({
      where: {
        id: creatorId,
        status: stringConstants.activeStatus,
        deletedAt: IsNull(),
      },
    });
    if (!creator) {
      throw new NotFoundCustomException(NotFoundCustomExceptionType.USER);
    }
    return creator;
  }

  private async applyType(
    manager: EntityManager,
    opl: OplMstr,
    oplTypeId?: number,
  ) {
    if (!oplTypeId) {
      return;
    }
    const oplType = await manager.getRepository(OplTypes).findOne({
      where: {
        id: oplTypeId,
        siteId: opl.siteId,
        status: stringConstants.activeStatus,
        deletedAt: IsNull(),
      },
    });
    if (!oplType) {
      throw new NotFoundCustomException(NotFoundCustomExceptionType.OPL_TYPE);
    }
    opl.oplType = oplType.documentType;
    opl.oplTypeId = oplType.id;
  }
}
