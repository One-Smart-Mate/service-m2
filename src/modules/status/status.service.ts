import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StatusEntity } from './entities/status.entity';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';

@Injectable()
export class StatusService {
  constructor(
    @InjectRepository(StatusEntity)
    private readonly statusRepository: Repository<StatusEntity>,
  ) {}

  findAllStatus = async () => {
    try {
      return await this.statusRepository.find();
    } catch (exception) {
      HandleException.exception(exception);
    }
  };
}
