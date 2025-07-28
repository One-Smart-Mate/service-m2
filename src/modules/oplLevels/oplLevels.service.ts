import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { OplLevelsEntity } from './entities/oplLevels.entity';
import { CreateOplLevelsDTO } from './models/create-opl-levels.dto';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';
import { NotFoundCustomException, NotFoundCustomExceptionType } from 'src/common/exceptions/types/notFound.exception';
import { OplMstr } from 'src/modules/oplMstr/entities/oplMstr.entity';
import { OplDetailsEntity } from 'src/modules/oplDetails/entities/oplDetails.entity';

@Injectable()
export class OplLevelsService {
  constructor(
    @InjectRepository(OplLevelsEntity)
    private readonly oplLevelsRepository: Repository<OplLevelsEntity>,
    @InjectRepository(OplMstr)
    private readonly oplMstrRepository: Repository<OplMstr>,
    @InjectRepository(OplDetailsEntity)
    private readonly oplDetailsRepository: Repository<OplDetailsEntity>,
  ) {}

  async create(createOplLevelsDTO: CreateOplLevelsDTO) {
    try {
      const oplLevels = this.oplLevelsRepository.create({
        oplId: createOplLevelsDTO.oplId,
        levelId: createOplLevelsDTO.levelId,
      });
      return await this.oplLevelsRepository.save(oplLevels);
    } catch (exception) {
      HandleException.exception(exception);
    }
  }

  async findOplMstrByLevelId(levelId: number): Promise<any[]> {
    try {
      const oplLevels = await this.oplLevelsRepository.find({
        where: { levelId, deletedAt: null },
        relations: ['opl'],
      });

      if (!oplLevels || oplLevels.length === 0) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.OPLLEVELS);
      }

      const oplIds = oplLevels.map(oplLevel => oplLevel.opl?.id).filter(id => id != null);
      
      if (oplIds.length === 0) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.OPL_MSTR); 
      }

      const opls = await this.oplMstrRepository.find({
        where: { id: In(oplIds), deletedAt: null }
      });

      const details = await this.oplDetailsRepository.find({
        where: { oplId: In(oplIds) },
        order: { order: 'ASC' }
      });

      // Update direct usage counters for OPLs accessed from menu
      if (oplIds.length > 0) {
        await this.updateOplDirectUsageCounters(oplIds);
      }

      const oplLevelMap = new Map();
      oplLevels.forEach(oplLevel => {
        if (oplLevel.opl?.id) {
          oplLevelMap.set(oplLevel.opl.id, oplLevel.id);
        }
      });

      return opls.map(opl => ({
        ...opl,
        oplLevelId: oplLevelMap.get(opl.id),
        details: details.filter(detail => detail.oplId === opl.id)
      }));
    } catch (exception) {
      HandleException.exception(exception);
    }
  }

  async remove(id: number) {
    try {
      const oplLevels = await this.oplLevelsRepository.findOne({
        where: { id },
      });
      if (!oplLevels) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.OPLLEVELS);
      }
      
      oplLevels.deletedAt = new Date();
      await this.oplLevelsRepository.save(oplLevels);
    } catch (exception) {
      HandleException.exception(exception);
    }
  }

  /**
   * Updates the direct usage counters for OPLs accessed from menu
   * @param oplIds Array of OPL IDs to update
   */
  private async updateOplDirectUsageCounters(oplIds: number[]): Promise<void> {
    try {
      const currentTime = new Date();

      // Update direct usage counter for all accessed OPLs
      await this.oplMstrRepository
        .createQueryBuilder()
        .update(OplMstr)
        .set({
          directUsageCount: () => 'COALESCE(direct_usage_count, 0) + 1',
          lastUsedAt: currentTime
        })
        .whereInIds(oplIds)
        .execute();
    } catch (exception) {
      HandleException.exception(exception);
    }
  }
} 