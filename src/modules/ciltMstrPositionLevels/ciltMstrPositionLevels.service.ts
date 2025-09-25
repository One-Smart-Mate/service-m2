import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { CiltMstrPositionLevelsEntity } from './entities/ciltMstrPositionLevels.entity';
import { CreateCiltMstrPositionLevelsDto } from './model/create.ciltMstrPositionLevels.dto';
import { UpdateCiltMstrPositionLevelsDto } from './model/update.ciltMstrPositionLevels.dto';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';
import { NotFoundCustomException, NotFoundCustomExceptionType } from 'src/common/exceptions/types/notFound.exception';
import { CiltMstrEntity } from '../ciltMstr/entities/ciltMstr.entity';
import { PositionEntity } from '../position/entities/position.entity';
import { LevelEntity } from '../level/entities/level.entity';

@Injectable()
export class CiltMstrPositionLevelsService {
  constructor(
    @InjectRepository(CiltMstrPositionLevelsEntity)
    private readonly ciltMstrPositionLevelsRepository: Repository<CiltMstrPositionLevelsEntity>,
    @InjectRepository(CiltMstrEntity)
    private readonly ciltMstrRepository: Repository<CiltMstrEntity>,
    @InjectRepository(PositionEntity)
    private readonly positionRepository: Repository<PositionEntity>,
    @InjectRepository(LevelEntity)
    private readonly levelRepository: Repository<LevelEntity>,
  ) {}

  findAll = async () => {
    try {
      return await this.ciltMstrPositionLevelsRepository.find({
        where: { deletedAt: IsNull() },
        relations: ['position', 'ciltMstr', 'ciltMstr.sequences']
      });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findBySiteId = async (siteId: number) => {
    try {
      return await this.ciltMstrPositionLevelsRepository.find({ 
        where: { 
          siteId,
          deletedAt: IsNull() 
        },
        relations: ['position', 'ciltMstr', 'ciltMstr.sequences']
      });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findByCiltMstrId = async (ciltMstrId: number) => {
    try {
      return await this.ciltMstrPositionLevelsRepository.find({ 
        where: { 
          ciltMstrId,
          deletedAt: IsNull() 
        },
        relations: ['position', 'ciltMstr', 'ciltMstr.sequences']
      });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findByPositionId = async (positionId: number) => {
    try {
      return await this.ciltMstrPositionLevelsRepository.find({ 
        where: { 
          positionId,
          deletedAt: IsNull() 
        },
        relations: ['position', 'ciltMstr', 'ciltMstr.sequences']
      });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findByLevelId = async (levelId: number) => {
    try {
      return await this.ciltMstrPositionLevelsRepository.find({ 
        where: { 
          levelId,
          deletedAt: IsNull() 
        },
        relations: ['position', 'ciltMstr', 'ciltMstr.sequences']
      });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findById = async (id: number) => {
    try {
      const positionLevel = await this.ciltMstrPositionLevelsRepository.findOne({ 
        where: { 
          id,
          deletedAt: IsNull() 
        },
        relations: ['position', 'ciltMstr', 'ciltMstr.sequences']
      });
      if (!positionLevel) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.CILT_MSTR_POSITION_LEVELS);
      }
      return positionLevel;
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  create = async (createDto: CreateCiltMstrPositionLevelsDto) => {
    try {
      const ciltMstr = await this.ciltMstrRepository.findOne({
        where: { 
          id: createDto.ciltMstrId,
          deletedAt: IsNull()
        }
      });
      if (!ciltMstr) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.CILT_MSTR);
      }

      const position = await this.positionRepository.findOne({
        where: { 
          id: createDto.positionId,
          deletedAt: IsNull()
        }
      });
      if (!position) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.POSITION);
      }

      const level = await this.levelRepository.findOne({
        where: { 
          id: createDto.levelId,
          deletedAt: IsNull()
        }
      });
      if (!level) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.LEVELS);
      }

      const positionLevel = this.ciltMstrPositionLevelsRepository.create(createDto);
      return await this.ciltMstrPositionLevelsRepository.save(positionLevel);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  update = async (updateDto: UpdateCiltMstrPositionLevelsDto) => {
    try {
      const positionLevel = await this.findById(updateDto.id);
      if (!positionLevel) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.CILT_MSTR_POSITION_LEVELS);
      }

      if (updateDto.ciltMstrId) {
        const ciltMstr = await this.ciltMstrRepository.findOne({
          where: { 
            id: updateDto.ciltMstrId,
            deletedAt: IsNull()
          }
        });
        if (!ciltMstr) {
          throw new NotFoundCustomException(NotFoundCustomExceptionType.CILT_MSTR);
        }
      }

      if (updateDto.positionId) {
        const position = await this.positionRepository.findOne({
          where: { 
            id: updateDto.positionId,
            deletedAt: IsNull()
          }
        });
        if (!position) {
          throw new NotFoundCustomException(NotFoundCustomExceptionType.POSITION);
        }
      }

      if (updateDto.levelId) {
        const level = await this.levelRepository.findOne({
          where: { 
            id: updateDto.levelId,
            deletedAt: IsNull()
          }
        });
        if (!level) {
          throw new NotFoundCustomException(NotFoundCustomExceptionType.LEVELS);
        }
      }

      Object.assign(positionLevel, updateDto);
      return await this.ciltMstrPositionLevelsRepository.save(positionLevel);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  remove = async (id: number) => {
    try {
      const positionLevel = await this.findById(id);
      if (!positionLevel) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.CILT_MSTR_POSITION_LEVELS);
      }
      await this.ciltMstrPositionLevelsRepository.softDelete(id);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  async softDelete(id: number){
    try {
      const positionLevel = await this.findById(id);
      if (!positionLevel) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.CILT_MSTR_POSITION_LEVELS);
      }
      return await this.ciltMstrPositionLevelsRepository.softDelete(id);
    } catch (exception) {
      HandleException.exception(exception);
    }
  }

  findByLevelIdWithRecentExecutions = async (levelId: number) => {
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      return await this.ciltMstrPositionLevelsRepository
        .createQueryBuilder('cpl')
        .leftJoinAndSelect('cpl.position', 'position')
        .leftJoinAndSelect('cpl.ciltMstr', 'ciltMstr')
        .leftJoinAndSelect('ciltMstr.sequences', 'sequences')
        .leftJoinAndSelect('sequences.executions', 'executions', 'executions.createdAt >= :date', {
          date: twentyFourHoursAgo
        })
        .leftJoinAndSelect('executions.evidences', 'evidences')
        .leftJoinAndSelect('executions.referenceOplSop', 'referenceOplSop')
        .leftJoinAndSelect('executions.remediationOplSop', 'remediationOplSop')
        .where('cpl.levelId = :levelId AND cpl.deletedAt IS NULL', { levelId })
        .getMany();
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findByPositionIdWithRecentExecutions = async (positionId: number) => {
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      return await this.ciltMstrPositionLevelsRepository
        .createQueryBuilder('cpl')
        .leftJoinAndSelect('cpl.position', 'position')
        .leftJoinAndSelect('cpl.ciltMstr', 'ciltMstr')
        .leftJoinAndSelect('ciltMstr.sequences', 'sequences')
        .leftJoinAndSelect('sequences.executions', 'executions', 'executions.createdAt >= :date', {
          date: twentyFourHoursAgo
        })
        .leftJoinAndSelect('executions.evidences', 'evidences')
        .leftJoinAndSelect('executions.referenceOplSop', 'referenceOplSop')
        .leftJoinAndSelect('executions.remediationOplSop', 'remediationOplSop')
        .where('cpl.positionId = :positionId AND cpl.deletedAt IS NULL', { positionId })
        .getMany();
    } catch (exception) {
      HandleException.exception(exception);
    }
  };
}
