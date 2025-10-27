import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PositionEntity } from './entities/position.entity';
import { CreatePositionDto } from './models/dto/create.position.dto';
import { UpdatePositionDto } from './models/dto/update.position.dto';
import { UpdatePositionOrderDTO } from './models/dto/update-order.dto';
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
      return await this.positionRepository.find({
        order: { order: 'ASC' }
      });
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
      return await this.positionRepository.find({
        where: { siteId },
        order: { order: 'ASC' }
      });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findBySiteIdAndLevelId = async (siteId: number, levelId: number) => {
    try {
      return await this.positionRepository.find({ 
        where: { siteId, levelId },
        order: { order: 'ASC' }
      });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findByAreaId = async (areaId: number) => {
    try {
      return await this.positionRepository.find({ 
        where: { areaId },
        order: { order: 'ASC' }
      });
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
        .orderBy('position.order', 'ASC')
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

      // Found existing positions for the same site
      const existingPositions = await this.positionRepository.find({
        where: { siteId: createPositionDto.siteId },
        order: { order: 'DESC' },
        take: 1
      });

      // Assign the next order number
      const nextOrder = existingPositions.length > 0 ? existingPositions[0].order + 1 : 1;
      createPositionDto.order = nextOrder;

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

  updateOrder = async (updateOrderDto: UpdatePositionOrderDTO) => {
    try {
      // Find the position to update
      const positionToUpdate = await this.positionRepository.findOneBy({
        id: updateOrderDto.positionId,
      });
      if (!positionToUpdate) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.POSITION);
      }

      // Find the position that currently has the new order
      const positionWithNewOrder = await this.positionRepository.findOne({
        where: {
          siteId: positionToUpdate.siteId,
          order: updateOrderDto.newOrder,
        },
      });

      if (positionWithNewOrder) {
        // Swap orders
        const oldOrder = positionToUpdate.order;
        positionToUpdate.order = updateOrderDto.newOrder;
        positionWithNewOrder.order = oldOrder;

        // Save both positions
        await this.positionRepository.save(positionWithNewOrder);
        return await this.positionRepository.save(positionToUpdate);
      } else {
        // If no position has the new order, just update the order
        positionToUpdate.order = updateOrderDto.newOrder;
        return await this.positionRepository.save(positionToUpdate);
      }
    } catch (exception) {
      HandleException.exception(exception);
    }
  };
}
