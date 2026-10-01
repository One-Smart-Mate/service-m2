import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
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
import { LevelEntity } from '../level/entities/level.entity';
import { UpdateOplMstrOrderDTO } from './models/dto/update-order.dto';
import { OplMasterPersistence } from './opl-master.persistence';

@Injectable()
export class OplMstrService {
  constructor(
    @InjectRepository(OplMstr)
    private readonly oplRepository: Repository<OplMstr>,
    @InjectRepository(OplLevelsEntity)
    private readonly oplLevelsRepository: Repository<OplLevelsEntity>,
    @InjectRepository(OplDetailsEntity)
    private readonly oplDetailsRepository: Repository<OplDetailsEntity>,
    private readonly oplMasterPersistence: OplMasterPersistence,
  ) {}

  findAll = async () => {
    try {
      const opls = await this.oplRepository.find();
      const oplIds = opls.map((opl) => opl.id);
      const details = await this.oplDetailsRepository.find({
        where: { oplId: In(oplIds) },
        order: { order: 'ASC' },
      });

      return opls.map((opl) => ({
        ...opl,
        details: details.filter((detail) => detail.oplId === opl.id),
      }));
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findByCreatorId = async (creatorId: number) => {
    try {
      const opls = await this.oplRepository.find({ where: { creatorId } });
      const oplIds = opls.map((opl) => opl.id);
      const details = await this.oplDetailsRepository.find({
        where: { oplId: In(oplIds) },
        order: { order: 'ASC' },
      });

      return opls.map((opl) => ({
        ...opl,
        details: details.filter((detail) => detail.oplId === opl.id),
      }));
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findById = async (id: number) => {
    try {
      const opl = await this.oplRepository.findOneBy({ id });
      if (!opl) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.OPL_MSTR);
      }
      const [hydratedOpl] = await this.attachDetailsAndLevels(
        [opl],
        Number(opl.siteId),
      );
      return hydratedOpl;
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findOplMstrBySiteId = async (siteId: number) => {
    try {
      const opls = await this.oplRepository.find({
        where: { siteId },
        order: { order: 'ASC' },
      });

      if (!opls || opls.length === 0) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.OPL_MSTR);
      }
      return await this.attachDetailsAndLevels(opls, siteId);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  searchByTitleOrLevelName = async (siteId: number, query: string) => {
    try {
      const normalizedQuery = query.trim().toLocaleLowerCase();
      const matches = await this.oplRepository
        .createQueryBuilder('opl')
        .leftJoin(
          OplLevelsEntity,
          'oplLevel',
          `oplLevel.oplId = opl.id
            AND oplLevel.deletedAt IS NULL
            AND (oplLevel.siteId IS NULL OR oplLevel.siteId = :siteId)`,
          { siteId },
        )
        .leftJoin(
          LevelEntity,
          'level',
          `level.id = oplLevel.levelId
            AND level.deletedAt IS NULL
            AND level.siteId = :siteId`,
          { siteId },
        )
        .where('opl.siteId = :siteId', { siteId })
        .andWhere('opl.deletedAt IS NULL')
        .andWhere(
          '(LOWER(opl.title) LIKE :query OR LOWER(level.name) LIKE :query)',
          { query: `%${normalizedQuery}%` },
        )
        .select('opl.id', 'id')
        .distinct(true)
        .getRawMany<{ id: string | number }>();

      const oplIds = matches.map((match) => Number(match.id));
      if (oplIds.length === 0) {
        return [];
      }

      const opls = await this.oplRepository.find({
        where: {
          id: In(oplIds),
          siteId,
          deletedAt: IsNull(),
        },
        order: { order: 'ASC', id: 'ASC' },
      });

      return await this.attachDetailsAndLevels(opls, siteId);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  create = async (createOplDto: CreateOplMstrDTO, creatorId: number) => {
    try {
      return await this.oplMasterPersistence.create(createOplDto, creatorId);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  update = async (updateOplDto: UpdateOplMstrDTO) => {
    try {
      return await this.oplMasterPersistence.update(updateOplDto);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  updateOrder = async (updateOrderDto: UpdateOplMstrOrderDTO) => {
    try {
      return await this.oplMasterPersistence.updateOrder(updateOrderDto);
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

  private async attachDetailsAndLevels(opls: OplMstr[], siteId: number) {
    if (opls.length === 0) {
      return [];
    }

    const oplIds = opls.map((opl) => opl.id);
    const [details, assignments] = await Promise.all([
      this.oplDetailsRepository.find({
        where: [
          { oplId: In(oplIds), siteId, deletedAt: IsNull() },
          { oplId: In(oplIds), siteId: IsNull(), deletedAt: IsNull() },
        ],
        order: { order: 'ASC', id: 'ASC' },
      }),
      this.oplLevelsRepository.find({
        where: {
          oplId: In(oplIds),
          deletedAt: IsNull(),
        },
        relations: ['level'],
      }),
    ]);

    const assignmentsByOplId = new Map<number, OplLevelsEntity[]>();
    assignments.forEach((assignment) => {
      const level = assignment.level;
      const relationSiteId = assignment.siteId ?? level?.siteId;
      if (
        !level ||
        level.deletedAt != null ||
        Number(level.siteId) !== Number(siteId) ||
        Number(relationSiteId) !== Number(siteId)
      ) {
        return;
      }

      const currentAssignments = assignmentsByOplId.get(assignment.oplId) ?? [];
      currentAssignments.push(assignment);
      assignmentsByOplId.set(assignment.oplId, currentAssignments);
    });

    return opls.map((opl) => ({
      ...opl,
      details: details.filter((detail) => detail.oplId === opl.id),
      levels: (assignmentsByOplId.get(opl.id) ?? [])
        .sort((left, right) => {
          const levelDifference = left.level.level - right.level.level;
          return levelDifference !== 0
            ? levelDifference
            : left.level.name.localeCompare(right.level.name);
        })
        .map((assignment) => ({
          oplLevelId: assignment.id,
          id: assignment.level.id,
          name: assignment.level.name,
          description: assignment.level.description,
          levelMachineId: assignment.level.levelMachineId,
          level: assignment.level.level,
          superiorId: assignment.level.superiorId,
        })),
    }));
  }
}
