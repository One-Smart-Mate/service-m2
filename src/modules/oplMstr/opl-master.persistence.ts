import { OplLevelsEntity } from '../oplLevels/entities/oplLevels.entity';
import { OplDetailsEntity } from '../oplDetails/entities/oplDetails.entity';
import {
  validateOrder,
  withSiteTransaction,
} from '../../common/database/site-transaction';
import { withLockedOpl } from './opl-transaction';
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
    return withSiteTransaction(this.dataSource, dto.siteId, async (manager) => {
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
        order: validateOrder(Number(lastOpl?.order ?? 0) + 1),
      });
      await this.applyType(manager, opl, dto.oplTypeId);
      return repository.save(opl);
    });
  }

  update(dto: UpdateOplMstrDTO) {
    return withLockedOpl(this.dataSource, dto.id, async (manager, opl) => {
      const repository = manager.getRepository(OplMstr);
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
      delete (changes as any).order;
      Object.assign(opl, changes);
      await this.applyType(manager, opl, dto.oplTypeId);
      return repository.save(opl);
    });
  }

  updateOrder(dto: UpdateOplMstrOrderDTO) {
    validateOrder(dto.newOrder);
    return withLockedOpl(this.dataSource, dto.oplId, async (manager, opl) => {
      const repository = manager.getRepository(OplMstr);
      if (opl.order === dto.newOrder) {
        return opl;
      }

      const target = await repository.findOne({
        where: {
          siteId: opl.siteId === null ? IsNull() : opl.siteId,
          order: dto.newOrder,
          deletedAt: IsNull(),
        },
        lock: { mode: 'pessimistic_write' },
      });
      const previousOrder = opl.order;
      opl.order = dto.newOrder;
      if (target) {
        target.order = previousOrder;
        await repository.update(target.id, { order: previousOrder });
        await repository.update(opl.id, { order: dto.newOrder });
      } else {
        await repository.update(opl.id, { order: dto.newOrder });
      }
      return opl;
    });
  }

  delete(id: number) {
    return withLockedOpl(this.dataSource, id, async (manager, opl) => {
      await manager
        .getRepository(OplDetailsEntity)
        .softDelete({ oplId: opl.id });
      await manager
        .getRepository(OplLevelsEntity)
        .softDelete({ oplId: opl.id });
      return manager.getRepository(OplMstr).softDelete(opl.id);
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
        siteId: opl.siteId === null ? IsNull() : opl.siteId,
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
