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
import { CiltSequencePersistence } from './cilt-sequence.persistence';

@Injectable()
export class CiltSequencesService {
  constructor(
    @InjectRepository(CiltSequencesEntity)
    private readonly ciltSequencesRepository: Repository<CiltSequencesEntity>,
    private readonly ciltSequencePersistence: CiltSequencePersistence,
  ) {}

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
      return await this.ciltSequencePersistence.create(dto);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  update = async (updateDTO: UpdateCiltSequenceDTO) => {
    try {
      return await this.ciltSequencePersistence.update(updateDTO);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  updateOrder = async (updateOrderDto: UpdateSequenceOrderDTO) => {
    try {
      return await this.ciltSequencePersistence.updateOrder(updateOrderDto);
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
