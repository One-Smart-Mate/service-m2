import { Injectable } from '@nestjs/common';
import { CreateLevelDto } from './models/dto/create.level.dto';
import { UpdateLevelDto } from './models/dto/update.level.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { LevelEntity } from './entities/level.entity';
import { Repository } from 'typeorm';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';
import {
  NotFoundCustomException,
  NotFoundCustomExceptionType,
} from 'src/common/exceptions/types/notFound.exception';
import { UsersService } from '../users/users.service';
import { SiteService } from '../site/site.service';

@Injectable()
export class LevelService {
  constructor(
    @InjectRepository(LevelEntity)
    private readonly levelRepository: Repository<LevelEntity>,
    private readonly usersService: UsersService,
    private readonly siteService: SiteService,
  ) {}

  findSiteLevels = async (siteId: number) => {
    try {
      return await this.levelRepository.findBy({ siteId: siteId });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };
  create = async (createLevelDTO: CreateLevelDto) => {
    try {
      const responsible = await this.usersService.findById(createLevelDTO.responsibleId);
      const site = await this.siteService.findById(createLevelDTO.siteId);
      if (!responsible) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.USER);
      } else if (!site) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.SITE);
      }

      createLevelDTO.companyId = site.companyId
      createLevelDTO.responsibleName = responsible.name
      createLevelDTO.createdAt = new Date()

      if(createLevelDTO.superiorId){
        createLevelDTO.level = await this.getActualLevelBySuperiorId(createLevelDTO.superiorId)
      }

      return await this.levelRepository.save(createLevelDTO)
    } catch (exception) {
      console.log(exception)
      HandleException.exception(exception);
    }
  };

  getActualLevelBySuperiorId = async (superiorId: number) => {
    try{
      const superiorLevel = await this.levelRepository.findOne({where: {id: superiorId}, select: ['level']})
      if(!superiorLevel){
        throw new NotFoundCustomException(NotFoundCustomExceptionType.LEVELS)
      }
      
      const actualLevel = Number(superiorLevel.level)+1

      return actualLevel
    }catch(exception){
      HandleException.exception(exception)
    }
  }
}
