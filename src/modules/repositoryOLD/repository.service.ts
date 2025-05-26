import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository as TypeOrmRepository } from 'typeorm';
import { Repository } from './entities/repository.entity';
import { CreateRepositoryDTO } from './models/dto/createRepository.dto';
import { UpdateRepositoryDTO } from './models/dto/updateRepository.dto';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';
import {
  NotFoundCustomException,
  NotFoundCustomExceptionType,
} from 'src/common/exceptions/types/notFound.exception';

@Injectable()
export class RepositoryService {
  constructor(
    @InjectRepository(Repository)
    private readonly repositoryRepository: TypeOrmRepository<Repository>,
  ) {}

  findAll = async () => {
    try {
      return await this.repositoryRepository.find();
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findById = async (id: number) => {
    try {
      const repository = await this.repositoryRepository.findOneBy({ id });
      if (!repository) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.REPOSITORY);
      }
      return repository;
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  create = async (createRepositoryDto: CreateRepositoryDTO) => {
    try {
      const repository = this.repositoryRepository.create(createRepositoryDto);
      return await this.repositoryRepository.save(repository);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  update = async (updateRepositoryDto: UpdateRepositoryDTO) => {
    try {
      const repository = await this.repositoryRepository.findOneBy({
        id: updateRepositoryDto.id,
      });
      if (!repository) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.REPOSITORY);
      }

      Object.assign(repository, updateRepositoryDto);
      return await this.repositoryRepository.save(repository);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };
} 