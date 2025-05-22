import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull } from 'typeorm';
import { CiltMstrEntity } from './entities/ciltMstr.entity';
import { CreateCiltMstrDTO } from './models/dto/create.ciltMstr.dto';
import { UpdateCiltMstrDTO } from './models/dto/update.ciltMstr.dto';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';
import {
  NotFoundCustomException,
  NotFoundCustomExceptionType,
} from 'src/common/exceptions/types/notFound.exception';
import { UserEntity } from 'src/modules/users/entities/user.entity';
import { UsersPositionsEntity } from 'src/modules/users/entities/users.positions.entity';
import { CiltSequencesEntity } from 'src/modules/ciltSequences/entities/ciltSequences.entity';
import { CiltSequencesExecutionsEntity } from 'src/modules/CiltSequencesExecutions/entities/ciltSequencesExecutions.entity';

@Injectable()
export class CiltMstrService {
  constructor(
    @InjectRepository(CiltMstrEntity)
    private readonly ciltRepository: Repository<CiltMstrEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(UsersPositionsEntity)
    private readonly usersPositionsRepository: Repository<UsersPositionsEntity>,
    @InjectRepository(CiltSequencesEntity)
    private readonly ciltSequencesRepository: Repository<CiltSequencesEntity>,
    @InjectRepository(CiltSequencesExecutionsEntity)
    private readonly ciltSequencesExecutionsRepository: Repository<CiltSequencesExecutionsEntity>,
  ) {}

  findAll = async () => {
    try {
      return await this.ciltRepository.find();
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findBySiteId = async (siteId: number) => {
    try {
      return await this.ciltRepository.find({ where: { siteId } });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findByPositionId = async (positionId: number) => {
    try {
      return await this.ciltRepository.find({ where: { positionId } });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findById = async (id: number) => {
    try {
      const cilt = await this.ciltRepository.findOneBy({ id });
      if (!cilt) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.CILT_MSTR);
      }
      return cilt;
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  create = async (createCiltDto: CreateCiltMstrDTO) => {
    try {
      const cilt = this.ciltRepository.create(createCiltDto);
      return await this.ciltRepository.save(cilt);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  update = async (updateCiltDto: UpdateCiltMstrDTO) => {
    try {
      const cilt = await this.ciltRepository.findOneBy({
        id: updateCiltDto.id,
      });
      if (!cilt) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.CILT_MSTR);
      }

      Object.assign(cilt, updateCiltDto);
      return await this.ciltRepository.save(cilt);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findCiltsByUserId = async (userId: number) => {
    try {
      const user = await this.userRepository.findOneBy({ id: userId });
      if (!user) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.USER);
      }

      const userPositions = await this.usersPositionsRepository.find({
        where: { user: { id: userId } },
        relations: ['position'],
      });

      if (!userPositions.length) {
        return {
          userInfo: {
            id: user.id,
            name: user.name,
            email: user.email,
          },
          positions: []
        };
      }

      const positionIds = userPositions.map(up => up.position.id);

      const ciltMasters = await this.ciltRepository.find({
        where: { positionId: In(positionIds) },
      });

      const ciltSequences = await this.ciltSequencesRepository.find({
        where: { positionId: In(positionIds) },
      });

      const ciltExecutions = await this.ciltSequencesExecutionsRepository.find({
        where: { 
          positionId: In(positionIds),
          deletedAt: IsNull()
        },
      });

      const positions = userPositions.map(up => {
        const positionId = up.position.id;
        
        const positionCiltMasters = ciltMasters.filter(cm => cm.positionId === positionId);
        
        const mastersWithSequences = positionCiltMasters.map(master => {
          const masterSequences = ciltSequences.filter(
            seq => seq.positionId === positionId && seq.ciltMstrId === master.id
          );
          
          const sequencesWithExecutions = masterSequences.map(sequence => {
            const sequenceExecutions = ciltExecutions.filter(
              exec => exec.ciltSecuenceId === sequence.id
            );
            
            return {
              ...sequence,
              executions: sequenceExecutions
            };
          });
          
          return {
            ...master,
            sequences: sequencesWithExecutions
          };
        });
        
        return {
          id: positionId,
          name: up.position.name,
          siteName: up.position.siteName,
          areaName: up.position.areaName,
          ciltMasters: mastersWithSequences
        };
      });

      return {
        userInfo: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        positions
      };
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findCiltDetailsById = async (ciltMstrId: number) => {
    try {
      const ciltMstr = await this.ciltRepository.findOneBy({ id: ciltMstrId });
      if (!ciltMstr) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.CILT_MSTR);
      }

      const ciltSequences = await this.ciltSequencesRepository.find({
        where: { ciltMstrId },
      });

      // Get all sequence IDs
      const sequenceIds = ciltSequences.map(sequence => sequence.id);

      // Get executions for all sequences
      const ciltExecutions = await this.ciltSequencesExecutionsRepository.find({
        where: { 
          ciltSecuenceId: In(sequenceIds),
          deletedAt: IsNull()
        },
      });

      // Map executions to their respective sequences
      const sequencesWithExecutions = ciltSequences.map(sequence => {
        const sequenceExecutions = ciltExecutions.filter(
          exec => exec.ciltSecuenceId === sequence.id
        );

        return {
          ...sequence,
          executions: sequenceExecutions
        };
      });

      return {
        ciltInfo: {
          ...ciltMstr
        },
        sequences: sequencesWithExecutions
      };
    } catch (exception) {
      HandleException.exception(exception);
    }
  };
}
