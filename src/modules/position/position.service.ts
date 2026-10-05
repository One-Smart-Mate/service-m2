import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PositionEntity } from './entities/position.entity';
import { CreatePositionDto } from './models/dto/create.position.dto';
import { UpdatePositionDto } from './models/dto/update.position.dto';
import { UpdatePositionOrderDTO } from './models/dto/update-order.dto';
import { PositionPersistence } from './position.persistence';
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
    private readonly positionPersistence: PositionPersistence,
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
        .innerJoin(
          'user_has_sites',
          'membership',
          'membership.user_id = up.user_id AND membership.site_id = position.site_id',
        )
        .innerJoin('sites', 'site', 'site.id = position.site_id')
        .where('up.user_id = :userId', { userId })
        .andWhere('up.deleted_at IS NULL')
        .andWhere('position.deleted_at IS NULL')
        .andWhere('membership.status = :active AND membership.deleted_at IS NULL', { active: 'A' })
        .andWhere('site.status = :active AND site.deleted_at IS NULL', { active: 'A' })
        .distinct(true)
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
      return await this.positionPersistence.create(createPositionDto);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  update = async (updatePositionDto: UpdatePositionDto) => {
    try {
      return await this.positionPersistence.update(updatePositionDto);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  updateOrder = async (input: UpdatePositionOrderDTO) => {
    try {
      return await this.positionPersistence.updateOrder(input);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };
}
