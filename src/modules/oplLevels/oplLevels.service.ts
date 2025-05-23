import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OplLevelsEntity } from './entities/oplLevels.entity';
import { CreateOplLevelsDTO } from './models/create-opl-levels.dto';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';
import { NotFoundCustomException, NotFoundCustomExceptionType } from 'src/common/exceptions/types/notFound.exception';

@Injectable()
export class OplLevelsService {
  constructor(
    @InjectRepository(OplLevelsEntity)
    private readonly oplLevelsRepository: Repository<OplLevelsEntity>,
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
} 