import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PositionEntity } from './entities/position.entity';
import { CreatePositionDto } from './models/dto/create.position.dto';
import { UpdatePositionDto } from './models/dto/update.position.dto';
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

//   findAllBySite = async (siteId: number) => {
//     try {
//       return await this.positionRepository.findBy({ siteId:  siteId  });
//     } catch (exception) {
//       HandleException.exception(exception);
//     }
//   };

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
      const position = this.positionRepository.create(createPositionDto);
      return await this.positionRepository.save(position);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  update = async (updatePositionDto: UpdatePositionDto) => {
    try {
      const position = await this.positionRepository.findOneBy({
        id: updatePositionDto.id,
      });
      if (!position) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.POSITION);
      }

      Object.assign(position, updatePositionDto);
      return await this.positionRepository.save(position);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  // delete = async (id: number) => {
  //   try {
  //     const position = await this.positionRepository.findOneBy({ id });
  //     if (!position) {
  //       throw new NotFoundCustomException(NotFoundCustomExceptionType.POSITION);
  //     }
  //     await this.positionRepository.delete(id);
  //     return { message: 'Position deleted successfully' };
  //   } catch (exception) {
  //     HandleException.exception(exception);
  //   }
  // };
}
