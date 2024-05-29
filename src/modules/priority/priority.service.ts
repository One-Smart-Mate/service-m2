import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PriorityEntity } from './entities/priority.entity';
import { Repository } from 'typeorm';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';
import {
  NotFoundCustomException,
  NotFoundCustomExceptionType,
} from 'src/common/exceptions/types/notFound.exception';

@Injectable()
export class PriorityService {
  constructor(
    @InjectRepository(PriorityEntity)
    private readonly priorityRepository: Repository<PriorityEntity>,
  ) {}

  findCompanyPriorities = async (id: number) => {
    try {
      const existCompanyPriorities = await this.priorityRepository.existsBy({
        siteId: id,
      });

      if (!existCompanyPriorities) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.COMPANY);
      }

      return await this.priorityRepository.findBy({siteId: id})
    } catch (exception) {
      HandleException.exception(exception);
    }
  };
}
