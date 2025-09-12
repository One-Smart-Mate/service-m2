import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';
import { AmDiscardReasonEntity } from './entities/am-discard-reason.entity';
import { CreateAmDiscardReasonDto } from './models/dto/create-am-discard-reason.dto';
import { UpdateAmDiscardReasonDto } from './models/dto/update-am-discard-reason.dto';
import { NotFoundCustomException, NotFoundCustomExceptionType } from 'src/common/exceptions/types/notFound.exception';

@Injectable()
export class AmDiscardReasonService {
  constructor(
    @InjectRepository(AmDiscardReasonEntity)
    private readonly amDiscardReasonRepository: Repository<AmDiscardReasonEntity>,
  ) {}

  async create(createAmDiscardReasonDto: CreateAmDiscardReasonDto) {
    try {
      const newReason = this.amDiscardReasonRepository.create(
        createAmDiscardReasonDto,
      );
      return await this.amDiscardReasonRepository.save(newReason);
    } catch (exception) {
      HandleException.exception(exception);
    }
  }

  async findAll() {
    try {
      return await this.amDiscardReasonRepository.find();
    } catch (exception) {
      HandleException.exception(exception);
    }
  }

  async findBySite(siteId: number) {
    try {
      return await this.amDiscardReasonRepository.find({ where: { siteId } });
    } catch (exception) {
      HandleException.exception(exception);
    }
  }

  async findOne(id: number) {
    try {
      const reason = await this.amDiscardReasonRepository.findOneBy({ id });
      if (!reason) {
        throw new NotFoundException(`Discard reason with ID #${id} not found`);
      }
      return reason;
    } catch (exception) {
      HandleException.exception(exception);
    }
  }

  async update(updateAmDiscardReasonDto: UpdateAmDiscardReasonDto) {
    try {
      const reason = await this.amDiscardReasonRepository.findOneBy({ id: updateAmDiscardReasonDto.id });
      if (!reason) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.AM_DISCARD_REASON);
      }
      Object.assign(reason, updateAmDiscardReasonDto);
      return await this.amDiscardReasonRepository.save(reason);
    } catch (exception) {
      HandleException.exception(exception);
    }
  }
  async delete(id: number) {
    try {
      const reason = await this.amDiscardReasonRepository.findOneBy({ id });
      if (!reason) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.AM_DISCARD_REASON);
      }
      return await this.amDiscardReasonRepository.softDelete(id);
    } catch (exception) {
      HandleException.exception(exception);
    }
  }
} 