import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull, Equal } from 'typeorm';
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
import { CreateCiltSequencesExecutionDTO } from '../CiltSequencesExecutions/models/dto/create.ciltSequencesExecution.dto';
import { CiltSecuencesScheduleService } from '../ciltSecuencesSchedule/ciltSecuencesSchedule.service';

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
    private readonly ciltSecuencesScheduleService: CiltSecuencesScheduleService,
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

  findCiltsByUserId = async (userId: number, date: string) => {
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
        where: { ciltMstr: { positionId: In(positionIds) } },
        relations: ['ciltMstr'],
      });

      const ciltExecutions = await this.ciltSequencesExecutionsRepository.find({
        where: { 
          positionId: In(positionIds),
          deletedAt: IsNull(),
          secuenceSchedule: Equal(new Date(date)),
          status: 'A'
        },
        relations: ['evidences', 'referenceOplSop', 'remediationOplSop'],
        order: { secuenceStart: 'ASC' }
      });

      //  Get the scheduled sequences for the specified date
      const scheduledSequences = await this.ciltSecuencesScheduleService.findSchedulesForDateSimplified(date);

      const positions = userPositions.map(up => {
        const positionId = up.position.id;
          
        const positionCiltMasters = ciltMasters.filter(cm => cm.positionId === positionId);
          
        const mastersWithSequences = positionCiltMasters.map(master => {
          const masterSequences = ciltSequences.filter(
            seq => seq.ciltMstr.positionId === positionId && seq.ciltMstrId === master.id
          );
            
          const sequencesWithExecutions = masterSequences.map(sequence => {
            const sequenceExecutions = ciltExecutions.filter(
              exec => exec.ciltSecuenceId === sequence.id
            );

            // Check if the sequence is scheduled for today
            const isScheduledToday = scheduledSequences.some(
              scheduled => 
                scheduled.ciltId === master.id && 
                scheduled.secuenceId === sequence.id
            );

            let executions = [...sequenceExecutions];

            // Create a new execution if it is scheduled for today and has no executions for today
            if (isScheduledToday) {
              const hasExecutionForToday = sequenceExecutions.some(
                exec => {
                  const execDate = exec.secuenceSchedule ? new Date(exec.secuenceSchedule).toISOString().split('T')[0] : null;
                  return execDate === date;
                }
              );

              if (!hasExecutionForToday) {
                const executionDTO: CreateCiltSequencesExecutionDTO = {
                  siteId: master.siteId,
                  positionId: positionId,
                  ciltId: master.id,
                  ciltSecuenceId: sequence.id,
                  userId: user.id,
                  userWhoExecutedId: user.id,
                  secuenceSchedule: date,
                  secuenceStart: null,
                  secuenceStop: null,
                  duration: null,
                  realDuration: null,
                  standardOk: sequence.standardOk,
                  initialParameter: null,
                  evidenceAtCreation: null,
                  finalParameter: null,
                  evidenceAtFinal: null,
                  nok: null,
                  stoppageReason: null,
                  machineStopped: null,
                  amTagId: null,
                  referencePoint: sequence.referencePoint,
                  secuenceList: sequence.secuenceList,
                  secuenceColor: sequence.secuenceColor,
                  ciltTypeId: sequence.ciltTypeId,
                  ciltTypeName: sequence.ciltTypeName,
                  referenceOplSopId: sequence.referenceOplSopId,
                  remediationOplSopId: sequence.remediationOplSopId ? Number(sequence.remediationOplSopId) : null,
                  toolsRequiered: sequence.toolsRequired,
                  selectableWithoutProgramming: sequence.selectableWithoutProgramming,
                  status: 'A',
                  createdAt: new Date().toISOString()
                };

                this.ciltSequencesExecutionsRepository.save(executionDTO)
                  .then(newExecution => {
                    executions.push(newExecution);
                  })
                  .catch(error => {
                    console.error('Error creating execution:', error);
                  });
              }
            }
              
            // Filter executions to ensure they are only for the specific date and with status 'A'
            executions = executions.filter(exec => {
              const execDate = exec.secuenceSchedule ? new Date(exec.secuenceSchedule).toISOString().split('T')[0] : null;
              return execDate === date && exec.status === 'A';
            });
              
            return {
              ...sequence,
              executions
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
