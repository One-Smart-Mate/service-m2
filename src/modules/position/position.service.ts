import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PositionEntity } from './entities/position.entity';
import { CreatePositionDto } from './models/dto/create.position.dto';
import { UpdatePositionDto } from './models/dto/update.position.dto';
import { LevelService } from '../level/level.service';
import { UsersPositionsEntity } from '../users/entities/users.positions.entity';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';
import {
  NotFoundCustomException,
  NotFoundCustomExceptionType,
} from 'src/common/exceptions/types/notFound.exception';

@Injectable()
export class PositionService {
  constructor(
    @InjectRepository(PositionEntity)
    private readonly positionRepository: Repository<PositionEntity>,
    @InjectRepository(UsersPositionsEntity)
    private readonly usersPositionsRepository: Repository<UsersPositionsEntity>,
    private readonly levelService: LevelService,
  ) {}

  findAll = async () => {
    try {
      return await this.positionRepository.find();
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findById = async (id: number) => {
    try {
      const position = await this.positionRepository.findOneBy({ id });
      if (!position) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.POSITION);
      }
      return position;
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findBySiteId = async (siteId: number) => {
    try {
      return await this.positionRepository.find({ where: { siteId } });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findBySiteIdAndLevelId = async (siteId: number, levelId: number) => {
    try {
      return await this.positionRepository.find({ where: { siteId, levelId } });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findByAreaId = async (areaId: number) => {
    try {
      return await this.positionRepository.find({ where: { areaId } });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findAllByUser = async (userId: number) => {
    try {
      return await this.positionRepository
        .createQueryBuilder('position')
        .innerJoin('users_positions', 'up', 'up.position_id = position.id')
        .where('up.user_id = :userId', { userId })
        .getMany();
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  //   findAllBySiteWithUsers = async (siteId: number) => {
  //     try {
  //       return await this.positionRepository
  //         .createQueryBuilder('position')
  //         .leftJoinAndSelect('users_positions', 'up', 'up.position_id = position.id')
  //         .leftJoinAndSelect('users', 'user', 'user.id = up.user_id')
  //         .where('position.siteId = :siteId', { siteId })
  //         .getMany();
  //     } catch (exception) {
  //       HandleException.exception(exception);
  //     }
  //   };

  create = async (createPositionDto: CreatePositionDto) => {
    try {
      const lastLevel = await this.levelService.findLastLevelFromNode(createPositionDto.levelId);
      createPositionDto.areaId = lastLevel.area_id;
      createPositionDto.areaName = lastLevel.area_name;

      const position = this.positionRepository.create({
        ...createPositionDto,
        createdAt: new Date(),
      });

      const savedPosition = await this.positionRepository.save(position);

      if (createPositionDto.userIds) {
        const userPositions = createPositionDto.userIds.map((userId) => {
          const userPosition = this.usersPositionsRepository.create({
            user: { id: userId }, 
            position: savedPosition,
          });
          return userPosition;
        });
        await this.usersPositionsRepository.save(userPositions); 
      }

      return savedPosition;
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  update = async (updatePositionDto: UpdatePositionDto) => {
    try {
      const position = await this.positionRepository.findOneBy({ id: updatePositionDto.id });
      if (!position) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.POSITION);
      }

      const lastLevel = await this.levelService.findLastLevelFromNode(updatePositionDto.levelId);
      updatePositionDto.areaId = lastLevel.area_id;
      updatePositionDto.areaName = lastLevel.area_name;

      Object.assign(position, updatePositionDto);
      position.updatedAt = new Date();

      const updatedPosition = await this.positionRepository.save(position);

      if (updatePositionDto.userIds) {
        await this.usersPositionsRepository.delete({ position: updatedPosition });
        const userPositions = updatePositionDto.userIds.map((userId) => {
          return this.usersPositionsRepository.create({
            user: { id: userId },
            position: updatedPosition,
          });
        });
        await this.usersPositionsRepository.save(userPositions); 
      }

      return updatedPosition;
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

}
