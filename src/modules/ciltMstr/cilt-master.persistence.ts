import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager, IsNull } from 'typeorm';
import {
  NotFoundCustomException,
  NotFoundCustomExceptionType,
} from 'src/common/exceptions/types/notFound.exception';
import { stringConstants } from 'src/utils/string.constant';
import { CiltSequencesEntity } from '../ciltSequences/entities/ciltSequences.entity';
import { UserEntity } from '../users/entities/user.entity';
import { CiltMstrEntity } from './entities/ciltMstr.entity';
import {
  validateOrder,
  withSiteResourceTransaction,
  withSiteTransaction,
} from '../../common/database/site-transaction';
import { CreateCiltMstrDTO } from './models/dto/create.ciltMstr.dto';
import { UpdateCiltOrderDTO } from './models/dto/update-order.dto';
import { UpdateCiltMstrDTO } from './models/dto/update.ciltMstr.dto';

@Injectable()
export class CiltMasterPersistence {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  create(dto: CreateCiltMstrDTO, creatorId: number) {
    if (!dto.siteId) {
      throw new BadRequestException('siteId is required');
    }

    return withSiteTransaction(this.dataSource, dto.siteId, async (manager) => {
      const creator = await this.findActiveCreator(manager, creatorId);
      const repository = manager.getRepository(CiltMstrEntity);
      const lastCilt = await repository.findOne({
        where: { siteId: dto.siteId, deletedAt: IsNull() },
        order: { order: 'DESC' },
        lock: { mode: 'pessimistic_write' },
      });
      const clientData = { ...dto };
      delete clientData.creatorId;
      delete clientData.creatorName;
      delete clientData.order;

      return repository.save(
        repository.create({
          ...clientData,
          creatorId: creator.id,
          creatorName: creator.name,
          order: validateOrder(Number(lastCilt?.order ?? 0) + 1),
        }),
      );
    });
  }

  update(dto: UpdateCiltMstrDTO) {
    return withSiteResourceTransaction(
      this.dataSource,
      CiltMstrEntity,
      dto.id,
      async (manager, cilt) => {
        const repository = manager.getRepository(CiltMstrEntity);
        if (
          dto.siteId !== undefined &&
          Number(dto.siteId) !== Number(cilt.siteId)
        ) {
          throw new BadRequestException(
            'A CILT cannot be moved to another site',
          );
        }

        const changes = { ...dto };
        delete changes.id;
        delete changes.siteId;
        delete changes.creatorId;
        delete changes.creatorName;
        Object.assign(cilt, changes);
        return repository.save(cilt);
      },
    );
  }

  updateOrder(dto: UpdateCiltOrderDTO) {
    validateOrder(dto.newOrder);
    return withSiteResourceTransaction(
      this.dataSource,
      CiltMstrEntity,
      dto.ciltMstrId,
      async (manager, cilt) => {
        const repository = manager.getRepository(CiltMstrEntity);
        if (cilt.order === dto.newOrder) {
          return cilt;
        }

        const target = await repository.findOne({
          where: {
            siteId: cilt.siteId,
            order: dto.newOrder,
            deletedAt: IsNull(),
          },
          lock: { mode: 'pessimistic_write' },
        });
        const previousOrder = cilt.order;
        cilt.order = dto.newOrder;
        if (target) {
          target.order = previousOrder;
          await repository.save([target, cilt]);
        } else {
          await repository.save(cilt);
        }
        return cilt;
      },
    );
  }

  clone(id: number, creatorId: number) {
    return withSiteResourceTransaction(
      this.dataSource,
      CiltMstrEntity,
      id,
      async (manager, original) => {
        const repository = manager.getRepository(CiltMstrEntity);
        const sequenceRepository = manager.getRepository(CiltSequencesEntity);
        original.sequences = await sequenceRepository.findBy({
          ciltMstrId: id,
          siteId: Number(original.siteId),
          deletedAt: IsNull(),
        });
        const creator = await this.findActiveCreator(manager, creatorId);
        const lastCilt = await repository.findOne({
          where: { siteId: original.siteId, deletedAt: IsNull() },
          order: { order: 'DESC' },
          lock: { mode: 'pessimistic_write' },
        });
        const copy = await repository.save(
          repository.create({
            siteId: original.siteId,
            ciltName: `${original.ciltName} (Copy)`,
            ciltDescription: original.ciltDescription,
            creatorId: creator.id,
            creatorName: creator.name,
            reviewerId: original.reviewerId,
            reviewerName: original.reviewerName,
            approvedById: original.approvedById,
            approvedByName: original.approvedByName,
            ciltDueDate: original.ciltDueDate,
            standardTime: original.standardTime,
            urlImgLayout: original.urlImgLayout,
            order: validateOrder(Number(lastCilt?.order ?? 0) + 1),
            status: original.status,
          }),
        );

        const sequences = [];
        for (const originalSequence of [...(original.sequences ?? [])].sort(
          (left, right) => left.order - right.order,
        )) {
          const sequenceData = { ...originalSequence };
          delete sequenceData.id;
          delete sequenceData.createdAt;
          delete sequenceData.updatedAt;
          delete sequenceData.deletedAt;
          delete sequenceData.ciltMstr;
          delete sequenceData.executions;
          sequences.push(
            await sequenceRepository.save(
              sequenceRepository.create({
                ...sequenceData,
                ciltMstrId: copy.id,
                ciltMstrName: copy.ciltName,
              }),
            ),
          );
        }

        return { ciltMaster: copy, sequences };
      },
    );
  }

  softDelete(id: number) {
    return withSiteResourceTransaction(
      this.dataSource,
      CiltMstrEntity,
      id,
      (manager, master) => manager.softDelete(CiltMstrEntity, master.id),
    );
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
}
