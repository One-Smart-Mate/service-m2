import { Injectable } from '@nestjs/common';
import { CreateLevelDto } from './models/dto/create.level.dto';
import { UpdateLevelDto } from './models/dto/update.level.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { LevelEntity } from './entities/level.entity';
import { Repository } from 'typeorm';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';
import { NotFoundCustomException, NotFoundCustomExceptionType } from 'src/common/exceptions/types/notFound.exception';

@Injectable()
export class LevelService {
  constructor(@InjectRepository(LevelEntity) private readonly levelRepository: Repository<LevelEntity>){}

  findSiteLevels = async (siteId: number) => {
    try{
      return await this.levelRepository.findBy({siteId: siteId})
    }catch(exception){
      HandleException.exception(exception)
    }
  }
}
