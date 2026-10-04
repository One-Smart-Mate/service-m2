import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OplMstr } from './entities/oplMstr.entity';
import { CreateOplMstrDTO } from './models/dto/createOplMstr.dto';
import { UpdateOplMstrDTO } from './models/dto/updateOplMstr.dto';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';
import {
  NotFoundCustomException,
  NotFoundCustomExceptionType,
} from 'src/common/exceptions/types/notFound.exception';
import { OplLevelsEntity } from '../oplLevels/entities/oplLevels.entity';
import { OplDetailsEntity } from '../oplDetails/entities/oplDetails.entity';
import { OplUserAccessEntity } from './entities/oplUserAccess.entity';
import { LevelEntity } from '../level/entities/level.entity';
import { In, IsNull } from 'typeorm';
import { UpdateOplMstrOrderDTO } from './models/dto/update-order.dto';
import { OplTypes } from '../oplTypes/entities/oplTypes.entity';

@Injectable()
export class OplMstrService {
  private readonly logger = new Logger(OplMstrService.name);

  constructor(
    @InjectRepository(OplMstr)
    private readonly oplRepository: Repository<OplMstr>,
    @InjectRepository(OplLevelsEntity)
    private readonly oplLevelsRepository: Repository<OplLevelsEntity>,
    @InjectRepository(OplDetailsEntity)
    private readonly oplDetailsRepository: Repository<OplDetailsEntity>,
    @InjectRepository(OplTypes)
    private readonly oplTypesRepository: Repository<OplTypes>,
    @InjectRepository(OplUserAccessEntity)
    private readonly oplUserAccessRepository: Repository<OplUserAccessEntity>,
    @InjectRepository(LevelEntity)
    private readonly levelRepository: Repository<LevelEntity>,
  ) {}

  findAll = async () => {
    try {
      const opls = await this.oplRepository.find();
      const oplIds = opls.map(opl => opl.id);
      const details = await this.oplDetailsRepository.find({
        where: { oplId: In(oplIds) },
        order: { order: 'ASC' }
      });

      return opls.map(opl => ({
        ...opl,
        details: details.filter(detail => detail.oplId === opl.id)
      }));
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findByCreatorId = async (creatorId: number) => {
    try {
      const opls = await this.oplRepository.find({ where: { creatorId } });
      const oplIds = opls.map(opl => opl.id);
      const details = await this.oplDetailsRepository.find({
        where: { oplId: In(oplIds) },
        order: { order: 'ASC' }
      });

      return opls.map(opl => ({
        ...opl,
        details: details.filter(detail => detail.oplId === opl.id)
      }));
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findById = async (id: number, userId?: number) => {
    try {
      const opl = await this.oplRepository.findOneBy({ id });
      if (!opl) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.OPL_MSTR);
      }
      const details = await this.oplDetailsRepository.find({
        where: { oplId: id },
        order: { order: 'ASC' }
      });

      // Record this user's access to the OPL (best-effort; never block the read).
      if (userId) {
        this.recordUserAccess(Number(userId), opl).catch((e) =>
          this.logger.warn(`Failed to record OPL access: ${e?.message ?? e}`),
        );
      }

      return {
        ...opl,
        details
      };
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  /**
   * Upserts the (user, opl) access row and bumps the global direct_usage_count.
   */
  private async recordUserAccess(userId: number, opl: OplMstr): Promise<void> {
    const now = new Date();
    const existing = await this.oplUserAccessRepository.findOne({
      where: { userId, oplId: opl.id },
    });

    if (existing) {
      existing.accessCount = Number(existing.accessCount ?? 0) + 1;
      existing.lastAccessAt = now;
      await this.oplUserAccessRepository.save(existing);
    } else {
      const row = this.oplUserAccessRepository.create({
        userId,
        oplId: opl.id,
        siteId: (opl as any).siteId ?? null,
        accessCount: 1,
        lastAccessAt: now,
      });
      await this.oplUserAccessRepository.save(row);
    }

    await this.oplRepository
      .createQueryBuilder()
      .update(OplMstr)
      .set({
        directUsageCount: () => 'COALESCE(direct_usage_count, 0) + 1',
        lastUsedAt: now,
      } as any)
      .where('id = :id', { id: opl.id })
      .execute();
  }

  /**
   * Returns every OPL a user has accessed, with the OPL title, its node path,
   * the access count and the last access timestamp.
   */
  async findUserOplAccess(userId: number): Promise<any[]> {
    try {
      const accesses = await this.oplUserAccessRepository.find({
        where: { userId },
        order: { lastAccessAt: 'DESC' },
      });
      if (!accesses || accesses.length === 0) {
        return [];
      }

      const oplIds = [...new Set(accesses.map((a) => a.oplId))];
      const opls = await this.oplRepository.find({ where: { id: In(oplIds) } });
      const oplMap = new Map(opls.map((o) => [Number(o.id), o]));

      const oplLevels = await this.oplLevelsRepository.find({
        where: { oplId: In(oplIds), deletedAt: IsNull() },
      });
      const firstLevelByOpl = new Map<number, number>();
      for (const ol of oplLevels) {
        if (!firstLevelByOpl.has(Number(ol.oplId))) {
          firstLevelByOpl.set(Number(ol.oplId), Number(ol.levelId));
        }
      }

      const allLevels = await this.levelRepository.find({
        where: { deletedAt: IsNull() },
      });
      const levelById = new Map(allLevels.map((l) => [Number(l.id), l]));
      const buildPath = (levelId?: number): string | null => {
        if (!levelId) return null;
        const parts: string[] = [];
        const seen = new Set<number>();
        let current = levelById.get(Number(levelId));
        while (current && !seen.has(Number(current.id))) {
          seen.add(Number(current.id));
          parts.unshift(current.name);
          const parentId: number = Number(current.superiorId);
          if (!parentId || parentId === 0) break;
          current = levelById.get(parentId);
        }
        return parts.length ? parts.join(' › ') : null;
      };

      return accesses.map((a) => {
        const opl = oplMap.get(Number(a.oplId));
        const levelId = firstLevelByOpl.get(Number(a.oplId));
        return {
          oplId: a.oplId,
          title: opl?.title ?? null,
          oplTypeId: (opl as any)?.oplTypeId ?? null,
          path: buildPath(levelId),
          accessCount: a.accessCount,
          lastAccessAt: a.lastAccessAt,
        };
      });
    } catch (exception) {
      HandleException.exception(exception);
    }
  }

  findOplMstrByLevelId = async (levelId: number) => {
    try {
      const opls = await this.oplRepository
        .createQueryBuilder('opl')
        .innerJoin('opl_mstr_levels', 'oml', 'opl.id = oml.opl_id')
        .where('oml.level_id = :levelId', { levelId })
        .andWhere('oml.deleted_at IS NULL')
        .andWhere('opl.deleted_at IS NULL')
        .getMany();
      
      const oplIds = opls.map(opl => opl.id);
      const details = await this.oplDetailsRepository.find({
        where: { oplId: In(oplIds) },
        order: { order: 'ASC' }
      });

      return opls.map(opl => ({
        ...opl,
        details: details.filter(detail => detail.oplId === opl.id)
      }));
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findOplMstrBySiteId = async (siteId: number) => {
    try {
      const opls = await this.oplRepository.find({
        where: { siteId },
        order: { order: 'ASC' }
      });

      // An empty result is a valid state (the site simply has no OPLs yet),
      // not an error. Return [] so the client renders an empty list instead
      // of surfacing a 404 as "error loading OPL list".
      return opls ?? [];
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  create = async (createOplDto: CreateOplMstrDTO) => {
    try {
      const opl = this.oplRepository.create(createOplDto);
      if (createOplDto.oplTypeId) {
        const oplType = await this.oplTypesRepository.findOneBy({
          id: createOplDto.oplTypeId,
        });
        if (!oplType) {
          throw new NotFoundCustomException(NotFoundCustomExceptionType.OPL_TYPE);
        }
        opl.oplType = oplType.documentType;
        opl.oplTypeId = oplType.id;
      }
      return await this.oplRepository.save(opl);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  update = async (updateOplDto: UpdateOplMstrDTO) => {
    try {
      const opl = await this.oplRepository.findOneBy({
        id: updateOplDto.id,
      });
      if (!opl) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.OPL_MSTR);
      }

      Object.assign(opl, updateOplDto);
      if (updateOplDto.oplTypeId) {
        const oplType = await this.oplTypesRepository.findOneBy({
          id: updateOplDto.oplTypeId,
        });
        if (!oplType) {
          throw new NotFoundCustomException(NotFoundCustomExceptionType.OPL_TYPE);
        }
        opl.oplType = oplType.documentType;
        opl.oplTypeId = oplType.id;
      }
      return await this.oplRepository.save(opl);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  updateOrder = async (updateOrderDto: UpdateOplMstrOrderDTO) => {
    try {
      // Find the detail to update
      const oplToUpdate = await this.oplRepository.findOneBy({
        id: updateOrderDto.oplId,
      });
      if (!oplToUpdate) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.OPL_MSTR);
      }

      // Find the detail that currently has the new order
      const detailWithNewOrder = await this.oplDetailsRepository.findOne({
        where: {
          oplId: oplToUpdate.id,
          order: updateOrderDto.newOrder,
        },
      });

      if (detailWithNewOrder) {
        // Swap orders
        const oldOrder = oplToUpdate.order;
        oplToUpdate.order = updateOrderDto.newOrder;
        detailWithNewOrder.order = oldOrder;

        // Save both details
        await this.oplDetailsRepository.save(detailWithNewOrder);
        return await this.oplDetailsRepository.save(oplToUpdate);
      } else {
        // If no detail has the new order, just update the order
        oplToUpdate.order = updateOrderDto.newOrder;
        return await this.oplDetailsRepository.save(oplToUpdate);
      }
    } catch (exception) {
      HandleException.exception(exception);
    }
  };


  delete = async (id: number) => {
    try {
      const opl = await this.oplRepository.findOneBy({ id });
      if (!opl) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.OPL_MSTR);
      }
      
      return await this.oplRepository.softDelete(id);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };
} 