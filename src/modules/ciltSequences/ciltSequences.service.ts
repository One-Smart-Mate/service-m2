import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CiltSequencesEntity } from './entities/ciltSequences.entity';
import { CreateCiltSequenceDTO } from './models/dto/createCiltSequence.dto';
import { UpdateCiltSequenceDTO } from './models/dto/updateCiltSequence.dto';
import { UpdateSequenceOrderDTO } from './models/dto/update-order.dto';
import { HandleException } from '../../common/exceptions/handler/handle.exception';
import {
  NotFoundCustomException,
  NotFoundCustomExceptionType,
} from '../../common/exceptions/types/notFound.exception';
import { SiteEntity } from '../site/entities/site.entity';
import { CiltMstrEntity } from '../ciltMstr/entities/ciltMstr.entity';
import { CiltFrequenciesEntity } from '../ciltFrequencies/entities/ciltFrequencies.entity';
import { CiltTypesEntity } from '../ciltTypes/entities/ciltTypes.entity';
import { OplMstr } from '../oplMstr/entities/oplMstr.entity';

@Injectable()
export class CiltSequencesService {
  constructor(
    @InjectRepository(CiltSequencesEntity)
    private readonly ciltSequencesRepository: Repository<CiltSequencesEntity>,
    @InjectRepository(SiteEntity)
    private readonly siteRepository: Repository<SiteEntity>,
    @InjectRepository(CiltMstrEntity)
    private readonly ciltMstrRepository: Repository<CiltMstrEntity>,
    @InjectRepository(CiltFrequenciesEntity)
    private readonly ciltFrequenciesRepository: Repository<CiltFrequenciesEntity>,
    @InjectRepository(CiltTypesEntity)
    private readonly ciltTypeRepository: Repository<CiltTypesEntity>,
    @InjectRepository(OplMstr)
    private readonly oplMstrRepository: Repository<OplMstr>,
  ) {}

  private async validateRelatedEntities(
    dto: CreateCiltSequenceDTO | UpdateCiltSequenceDTO,
  ) {
    if (dto.siteId) {
      const site = await this.siteRepository.findOneBy({ id: dto.siteId });
      if (!site) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.SITE);
      }
    }

    if (dto.ciltMstrId) {
      const ciltMstr = await this.ciltMstrRepository.findOneBy({
        id: dto.ciltMstrId,
      });
      if (!ciltMstr) {
        throw new NotFoundCustomException(
          NotFoundCustomExceptionType.CILT_MSTR,
        );
      }
    }

    if (dto.frecuencyId) {
      const frequency = await this.ciltFrequenciesRepository.findOneBy({
        id: dto.frecuencyId,
      });
      if (!frequency) {
        throw new NotFoundCustomException(
          NotFoundCustomExceptionType.CILT_FREQUENCIES,
        );
      }
    }

    if (dto.ciltTypeId) {
      const ciltType = await this.ciltTypeRepository.findOneBy({
        id: dto.ciltTypeId,
      });
      if (!ciltType) {
        throw new NotFoundCustomException(
          NotFoundCustomExceptionType.CILT_TYPES,
        );
      }
    }
    if (dto.referenceOplSopId) {
      const referenceOplSop = await this.oplMstrRepository.findOneBy({
        id: dto.referenceOplSopId,
      });
      if (!referenceOplSop) {
        throw new NotFoundCustomException(
          NotFoundCustomExceptionType.OPL_MSTR,
        );
      }
    }
    if (dto.remediationOplSopId) {
      const remediationOplSop = await this.oplMstrRepository.findOneBy({
        id: dto.remediationOplSopId,
      });
      if (!remediationOplSop) {
        throw new NotFoundCustomException(
          NotFoundCustomExceptionType.OPL_MSTR,
        );
      }
    }
  }

  findAll = async () => {
    try {
      return await this.ciltSequencesRepository.find({
        order: { order: 'ASC' }
      });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findBySiteId = async (siteId: number) => {
    try {
      return await this.ciltSequencesRepository.find({ 
        where: { siteId },
        order: { order: 'ASC' }
      });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findByCiltMstrId = async (ciltMstrId: number) => {
    try {
      return await this.ciltSequencesRepository.find({ 
        where: { ciltMstrId },
        order: { order: 'ASC' }
      });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findById = async (id: number) => {
    try {
      const sequence = await this.ciltSequencesRepository.findOne({
        where: { id },
        relations: ['executions']
      });
      if (!sequence) {
        throw new NotFoundCustomException(
          NotFoundCustomExceptionType.CILT_SEQUENCES,
        );
      }
      return sequence;
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  create = async (dto: CreateCiltSequenceDTO) => {
    try {
      await this.validateRelatedEntities(dto);

      // Found existing sequences for the same cilt master
      const existingSequences = await this.ciltSequencesRepository.find({
        where: { ciltMstrId: dto.ciltMstrId },
        order: { order: 'DESC' },
        take: 1
      });

      // Assign the next order number
      const nextOrder = existingSequences.length > 0 ? existingSequences[0].order + 1 : 1;
      dto.order = nextOrder;

      const sequence = this.ciltSequencesRepository.create(dto);
      return await this.ciltSequencesRepository.save(sequence);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  update = async (updateDTO: UpdateCiltSequenceDTO) => {
    try {
      const sequence = await this.findById(updateDTO.id);
      await this.validateRelatedEntities(updateDTO);
      Object.assign(sequence, updateDTO);
      return await this.ciltSequencesRepository.save(sequence);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  updateOrder = async (updateOrderDto: UpdateSequenceOrderDTO) => {
    try {
      // Find the sequence to update
      const sequenceToUpdate = await this.ciltSequencesRepository.findOneBy({
        id: updateOrderDto.sequenceId,
      });
      if (!sequenceToUpdate) {
        throw new NotFoundCustomException(
          NotFoundCustomExceptionType.CILT_SEQUENCES,
        );
      }

      // Find the sequence that currently has the new order
      const sequenceWithNewOrder = await this.ciltSequencesRepository.findOne({
        where: {
          ciltMstrId: sequenceToUpdate.ciltMstrId,
          order: updateOrderDto.newOrder,
        },
      });

      if (sequenceWithNewOrder) {
        // Swap orders
        const oldOrder = sequenceToUpdate.order;
        sequenceToUpdate.order = updateOrderDto.newOrder;
        sequenceWithNewOrder.order = oldOrder;

        // Save both sequences
        await this.ciltSequencesRepository.save(sequenceWithNewOrder);
        return await this.ciltSequencesRepository.save(sequenceToUpdate);
      } else {
        // If no sequence has the new order, just update the order
        sequenceToUpdate.order = updateOrderDto.newOrder;
        return await this.ciltSequencesRepository.save(sequenceToUpdate);
      }
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  async softDelete(id: number){
    try{
      const sequence = await this.ciltSequencesRepository.findOneBy({ id });
      if (!sequence) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.CILT_SEQUENCES);
      }
      return await this.ciltSequencesRepository.softDelete(id);
    } catch (exception) {
      HandleException.exception(exception);
    }
  }
}
