import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull, Equal, Raw, Between } from 'typeorm';
import { CiltMstrEntity } from './entities/ciltMstr.entity';
import { CreateCiltMstrDTO } from './models/dto/create.ciltMstr.dto';
import { UpdateCiltMstrDTO } from './models/dto/update.ciltMstr.dto';
import { UpdateCiltOrderDTO } from './models/dto/update-order.dto';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';
import {
  NotFoundCustomException,
  NotFoundCustomExceptionType,
} from 'src/common/exceptions/types/notFound.exception';
import { UserEntity } from 'src/modules/users/entities/user.entity';
import { UsersPositionsEntity } from 'src/modules/users/entities/users.positions.entity';
import { CiltSequencesEntity } from '../ciltSequences/entities/ciltSequences.entity';
import { CiltSequencesExecutionsEntity } from '../CiltSequencesExecutions/entities/ciltSequencesExecutions.entity';
import { CreateCiltSequencesExecutionDTO } from '../CiltSequencesExecutions/models/dto/create.ciltSequencesExecution.dto';
import { CiltSecuencesScheduleService } from '../ciltSecuencesSchedule/ciltSecuencesSchedule.service';
import { CustomLoggerService } from 'src/common/logger/logger.service';
import { CiltMstrPositionLevelsEntity } from '../ciltMstrPositionLevels/entities/ciltMstrPositionLevels.entity';
import { OplMstr } from '../oplMstr/entities/oplMstr.entity';
import { LevelService } from '../level/level.service';

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
    @InjectRepository(CiltMstrPositionLevelsEntity)
    private readonly ciltMstrPositionLevelsRepository: Repository<CiltMstrPositionLevelsEntity>,
    @InjectRepository(OplMstr)
    private readonly oplMstrRepository: Repository<OplMstr>,
    private readonly ciltSecuencesScheduleService: CiltSecuencesScheduleService,
    private readonly levelService: LevelService,
    private readonly logger: CustomLoggerService,
  ) {}

  findAll = async () => {
    try {
      return await this.ciltRepository.find({
        order: { order: 'ASC' }
      });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findBySiteId = async (siteId: number) => {
    try {
      return await this.ciltRepository.find({ 
        where: { siteId },
        order: { order: 'ASC' }
      });
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
      // Found existing CILTs for the same site
      const existingCilts = await this.ciltRepository.find({
        where: { siteId: createCiltDto.siteId },
        order: { order: 'ASC' },
        take: 1
      });

      // Assign the next order number
      const nextOrder = existingCilts.length > 0 ? existingCilts[0].order + 1 : 1;
      createCiltDto.order = nextOrder;

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

  updateOrder = async (updateOrderDto: UpdateCiltOrderDTO) => {
    try {
      // Find the CILT to update
      const ciltToUpdate = await this.ciltRepository.findOneBy({
        id: updateOrderDto.ciltMstrId,
      });
      if (!ciltToUpdate) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.CILT_MSTR);
      }

      // Find the CILT that currently has the new order
      const ciltWithNewOrder = await this.ciltRepository.findOne({
        where: {
          siteId: ciltToUpdate.siteId,
          order: updateOrderDto.newOrder,
        },
      });

      if (ciltWithNewOrder) {
        // Swap orders
        const oldOrder = ciltToUpdate.order;
        ciltToUpdate.order = updateOrderDto.newOrder;
        ciltWithNewOrder.order = oldOrder;

        // Save both CILTs
        await this.ciltRepository.save(ciltWithNewOrder);
        return await this.ciltRepository.save(ciltToUpdate);
      } else {
        // If no CILT has the new order, just update the order
        ciltToUpdate.order = updateOrderDto.newOrder;
        return await this.ciltRepository.save(ciltToUpdate);
      }
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  async findCiltsByUserId(userId: number, date: string) {
    try {
      // Change date to midnight local
      const scheduleDate = new Date(date);

      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);

      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
  
      // 1) Search user
      const user = await this.userRepository.findOneBy({ id: userId });
      if (!user) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.USER);
      }
      this.logger.logProcess('USER', { userId, date });
  
      // 2) User positions
      const userPositions = await this.usersPositionsRepository.find({
        where: { user: { id: userId } },
        relations: ['position'],
      });
      this.logger.logProcess('USER POSITIONS', userPositions);
      if (!userPositions.length) {
        return { userInfo: { id: user.id, name: user.name, email: user.email }, positions: [] };
      }
  
      // 3) Active levels for those positions
      const positionIds = userPositions.map(up => up.position.id);
      this.logger.logProcess('POSITION IDS', positionIds);
      const ciltPositionLevels = await this.ciltMstrPositionLevelsRepository.find({
        where: {
          positionId: In(positionIds),
          status: 'A',
          deletedAt: IsNull(),
        },
        relations: ['ciltMstr', 'level'],
      });
      this.logger.logProcess('CILT POSITION LEVELS', ciltPositionLevels);
  
      // Get level paths for all levels
      const levelPaths = await Promise.all(
        ciltPositionLevels.map(async (cpl) => {
          const route = await this.levelService.getLevelPathById(cpl.levelId);
          return { ciltMstrId: cpl.ciltMstrId, levelId: cpl.levelId, route };
        })
      );
  
      // 4) Unique CILT masters
      const ciltMasters = Array.from(
        new Map(ciltPositionLevels.map(cpl => [cpl.ciltMstr.id, cpl.ciltMstr])).values()
      );
      this.logger.logProcess('CILT MASTERS', ciltMasters);
  
      // 5) Sequences of those CILTs (without ciltMstr relation)
      const ciltSequences = await this.ciltSequencesRepository.find({
        where: { ciltMstrId: In(ciltMasters.map(cm => cm.id)) }
      });
      this.logger.logProcess('CILT SEQUENCES', ciltSequences);
  
      // 6) Validate SOP references in parallel
      await Promise.all(
        ciltSequences.map(async seq => {
          if (seq.referenceOplSopId) {
            const ref = await this.oplMstrRepository.findOneBy({ id: seq.referenceOplSopId });
            if (!ref) throw new NotFoundCustomException(NotFoundCustomExceptionType.OPL_MSTR);
          }
          if (seq.remediationOplSopId) {
            const rem = await this.oplMstrRepository.findOneBy({ id: seq.remediationOplSopId });
            if (!rem) throw new NotFoundCustomException(NotFoundCustomExceptionType.OPL_MSTR);
          }
        })
      );
  
      // 7) Scheduled schedules for the date
      const scheduledSequences = await this.ciltSecuencesScheduleService.findSchedulesForDate(date);
      this.logger.logProcess('SCHEDULED SEQUENCES', scheduledSequences);
  
      // 8) Upsert executions
      for (const cpl of ciltPositionLevels) {
        const masterId = cpl.ciltMstr.id;
        for (const seq of ciltSequences.filter(s => s.ciltMstrId === masterId)) {
          const isScheduled = scheduledSequences.some(
            sch => sch.ciltId === masterId && sch.secuenceId === seq.id
          );
          if (!isScheduled) continue;
  
          // Get schedule details for this sequence
          const scheduleDetails = scheduledSequences.find(
            sch => sch.ciltId === masterId && sch.secuenceId === seq.id
          );

          const executionDate = new Date(scheduleDate);
          if (scheduleDetails?.schedule) {
              const timeParts = scheduleDetails.schedule.split(':');
              if (timeParts.length === 3) {
                  executionDate.setHours(Number(timeParts[0]));
                  executionDate.setMinutes(Number(timeParts[1]));
                  executionDate.setSeconds(Number(timeParts[2]));
              }
          }

          const existing = await this.ciltSequencesExecutionsRepository.findOne({
            where: {
              ciltId: masterId,
              ciltSecuenceId: seq.id,
              userId: user.id,
              secuenceSchedule: executionDate,
              deletedAt: IsNull(),
            }
          });
  
          if (existing) {
            // No modificar ejecuciones que ya fueron completadas
            if (existing.secuenceStart && existing.secuenceStop) {
              this.logger.logProcess('SKIPPING COMPLETED EXECUTION', { 
                id: existing.id, 
                secuenceStart: existing.secuenceStart, 
                secuenceStop: existing.secuenceStop 
              });
              continue;
            }
            await this.ciltSequencesExecutionsRepository.save(existing);
            this.logger.logProcess('UPDATED CILT SEQUENCES EXECUTION', { id: existing.id });
          } else {
            const lastExecution = await this.ciltSequencesExecutionsRepository.findOne({
              where: { siteId: cpl.siteId },
              order: { siteExecutionId: 'DESC' },
            });
            const nextSiteExecutionId = (lastExecution?.siteExecutionId || 0) + 1;

            const dto: Partial<CiltSequencesExecutionsEntity> = {
              siteId: cpl.siteId,
              siteExecutionId: nextSiteExecutionId,
              positionId: cpl.positionId,
              ciltId: masterId,
              ciltSecuenceId: seq.id,
              userId: user.id,
              userWhoExecutedId: user.id,
              secuenceSchedule: executionDate,
              standardOk: seq.standardOk,
              referencePoint: seq.referencePoint,
              secuenceList: seq.secuenceList,
              secuenceColor: seq.secuenceColor,
              ciltTypeId: seq.ciltTypeId,
              ciltTypeName: seq.ciltTypeName,
              referenceOplSopId: seq.referenceOplSopId,
              remediationOplSopId: seq.remediationOplSopId ? Number(seq.remediationOplSopId) : null,
              toolsRequiered: seq.toolsRequired,
              selectableWithoutProgramming: Boolean(seq.selectableWithoutProgramming),
              status: 'A',
              stoppageReason: Boolean(seq.stoppageReason),
              machineStopped: Boolean(seq.machineStopped),
              duration: seq.standardTime,
              levelId: cpl.levelId,
              route: await this.levelService.getLevelPathById(cpl.levelId),
              allowExecuteBefore: Boolean(scheduleDetails?.allowExecuteBefore),
              allowExecuteBeforeMinutes: scheduleDetails?.allowExecuteBeforeMinutes || null,
              toleranceBeforeMinutes: scheduleDetails?.toleranceBeforeMinutes || null,
              toleranceAfterMinutes: scheduleDetails?.toleranceAfterMinutes || null,
              allowExecuteAfterDue: Boolean(scheduleDetails?.allowExecuteAfterDue),
              specialWarning: seq.specialWarning,
            };
            const created = await this.ciltSequencesExecutionsRepository.save(dto as CiltSequencesExecutionsEntity);
            this.logger.logProcess('CREATED CILT SEQUENCES EXECUTION', { id: created.id });
          }
        }
      }
  
      // 9) Read all executions for the date
      const allExecutions = await this.ciltSequencesExecutionsRepository.find({
        where: {
          ciltId: In(ciltMasters.map(cm => cm.id)),
          status: 'A',
          deletedAt: IsNull(),
          secuenceSchedule: Between(dayStart, dayEnd),
          userId: userId,
        },
        relations: ['evidences', 'referenceOplSop', 'remediationOplSop'],
        order: { secuenceStart: 'ASC' },
      });
      this.logger.logProcess('CILT EXECUTIONS', allExecutions);
  
      // 10) Group sequences and executions
      const sequencesByMaster = new Map<number, CiltSequencesEntity[]>();
      ciltSequences.forEach(seq => {
        const list = sequencesByMaster.get(seq.ciltMstrId) ?? [];
        list.push(seq);
        sequencesByMaster.set(seq.ciltMstrId, list);
      });
      const executionsBySequence = new Map<number, CiltSequencesExecutionsEntity[]>();
      allExecutions.forEach(exec => {
        const list = executionsBySequence.get(exec.ciltSecuenceId) ?? [];
        list.push(exec);
        executionsBySequence.set(exec.ciltSecuenceId, list);
      });
  
      // 11) Build response ordered by secuenceSchedule
      const positions = userPositions.map(up => {
        const masters = ciltPositionLevels
          .filter(cpl => cpl.positionId === up.position.id)
          .map(cpl => {
            // Master sequences
            const master = cpl.ciltMstr;
            const levelInfo = levelPaths.find(lp => lp.ciltMstrId === master.id);
            const sequencesWithExecutions = (sequencesByMaster.get(master.id) ?? [])
              .map(seq => {
                const executions = (executionsBySequence.get(seq.id) ?? [])
                  .sort((a, b) => new Date(a.secuenceSchedule).getTime() - new Date(b.secuenceSchedule).getTime());
                
                // Exclude sequences that have no executions
                if (executions.length === 0) {
                  return null;
                }
                
                const { ciltMstr, ...seqFields } = seq as any;
                return { ...seqFields, executions };
              })
              .filter(seq => seq !== null);

            return { 
              ...master, 
              sequences: sequencesWithExecutions,
              levelId: levelInfo?.levelId,
              route: levelInfo?.route
            };
          });
  
        return {
          id: up.position.id,
          name: up.position.name,
          siteName: up.position.siteName,
          areaName: up.position.areaName,
          ciltMasters: masters,
        };
      });
  
      return {
        userInfo: { id: user.id, name: user.name, email: user.email },
        positions,
      };
    } catch (error) {
      HandleException.exception(error);
    }
  }
  
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

  async findCiltsBySiteId(siteId: number, date: string) {
    try {
      // Change date to midnight local
      const scheduleDate = new Date(date);

      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);

      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
  
      // 1) Get all CILTs for the site
      const ciltMasters = await this.ciltRepository.find({
        where: { 
          siteId,
          status: 'A',
          deletedAt: IsNull()
        }
      });
      this.logger.logProcess('CILT MASTERS', ciltMasters);
      if (!ciltMasters.length) {
        return { siteId, users: [] };
      }

      // 2) Get all sequences for these CILTs
      const ciltSequences = await this.ciltSequencesRepository.find({
        where: { 
          ciltMstrId: In(ciltMasters.map(cm => cm.id)),
          deletedAt: IsNull()
        }
      });
      this.logger.logProcess('CILT SEQUENCES', ciltSequences);

      // 3) Validate SOP references in parallel
      await Promise.all(
        ciltSequences.map(async seq => {
          if (seq.referenceOplSopId) {
            const ref = await this.oplMstrRepository.findOneBy({ id: seq.referenceOplSopId });
            if (!ref) throw new NotFoundCustomException(NotFoundCustomExceptionType.OPL_MSTR);
          }
          if (seq.remediationOplSopId) {
            const rem = await this.oplMstrRepository.findOneBy({ id: seq.remediationOplSopId });
            if (!rem) throw new NotFoundCustomException(NotFoundCustomExceptionType.OPL_MSTR);
          }
        })
      );

      // 4) Get active position levels for these CILTs
      const ciltPositionLevels = await this.ciltMstrPositionLevelsRepository.find({
        where: {
          ciltMstrId: In(ciltMasters.map(cm => cm.id)),
          status: 'A',
          deletedAt: IsNull(),
        },
        relations: ['position', 'level'],
      });
      this.logger.logProcess('CILT POSITION LEVELS', ciltPositionLevels);

      // Get level paths for all levels
      const levelPaths = await Promise.all(
        ciltPositionLevels.map(async (cpl) => {
          const route = await this.levelService.getLevelPathById(cpl.levelId);
          return { ciltMstrId: cpl.ciltMstrId, levelId: cpl.levelId, route };
        })
      );

      // 5) Get all users with these positions
      const positionIds = [...new Set(ciltPositionLevels.map(cpl => cpl.positionId))];
      const userPositions = await this.usersPositionsRepository.find({
        where: { 
          positionId: In(positionIds),
          deletedAt: IsNull()
        },
        relations: ['user', 'position'],
      });
      this.logger.logProcess('USER POSITIONS', userPositions);

      // 6) Get scheduled sequences for the date
      const scheduledSequences = await this.ciltSecuencesScheduleService.findSchedulesForDate(date);
      this.logger.logProcess('SCHEDULED SEQUENCES', scheduledSequences);

      // 7) Group users by their positions
      const usersByPosition = new Map<number, UserEntity[]>();
      userPositions.forEach(up => {
        const users = usersByPosition.get(up.positionId) || [];
        users.push(up.user);
        usersByPosition.set(up.positionId, users);
      });

      // 8) Upsert executions for each user and position
      for (const cpl of ciltPositionLevels) {
        const users = usersByPosition.get(cpl.positionId) || [];
        const masterId = cpl.ciltMstrId;
        
        for (const user of users) {
          for (const seq of ciltSequences.filter(s => s.ciltMstrId === masterId)) {
            const isScheduled = scheduledSequences.some(
              sch => sch.ciltId === masterId && sch.secuenceId === seq.id
            );
            if (!isScheduled) continue;

            // Get schedule details for this sequence
            const scheduleDetails = scheduledSequences.find(
              sch => sch.ciltId === masterId && sch.secuenceId === seq.id
            );

            const executionDate = new Date(scheduleDate);
            if (scheduleDetails?.schedule) {
                const timeParts = scheduleDetails.schedule.split(':');
                if (timeParts.length === 3) {
                    executionDate.setHours(Number(timeParts[0]));
                    executionDate.setMinutes(Number(timeParts[1]));
                    executionDate.setSeconds(Number(timeParts[2]));
                }
            }

            const existing = await this.ciltSequencesExecutionsRepository.findOne({
              where: {
                ciltId: masterId,
                ciltSecuenceId: seq.id,
                userId: user.id,
                secuenceSchedule: executionDate,
                deletedAt: IsNull(),
              }
            });

            if (existing) {
              // Not modify executions that have already been completed
              if (existing.secuenceStart && existing.secuenceStop) {
                this.logger.logProcess('SKIPPING COMPLETED EXECUTION', { 
                  id: existing.id, 
                  secuenceStart: existing.secuenceStart, 
                  secuenceStop: existing.secuenceStop 
                });
                continue;
              }
              await this.ciltSequencesExecutionsRepository.save(existing);
              this.logger.logProcess('UPDATED CILT SEQUENCES EXECUTION', { id: existing.id });
            } else {
              const lastExecution = await this.ciltSequencesExecutionsRepository.findOne({
                where: { siteId: cpl.siteId },
                order: { siteExecutionId: 'DESC' },
              });
              const nextSiteExecutionId = (lastExecution?.siteExecutionId || 0) + 1;

              const dto: Partial<CiltSequencesExecutionsEntity> = {
                siteId: cpl.siteId,
                siteExecutionId: nextSiteExecutionId,
                positionId: cpl.positionId,
                ciltId: masterId,
                ciltSecuenceId: seq.id,
                userId: user.id,
                userWhoExecutedId: user.id,
                secuenceSchedule: executionDate,
                standardOk: seq.standardOk,
                referencePoint: seq.referencePoint,
                secuenceList: seq.secuenceList,
                secuenceColor: seq.secuenceColor,
                ciltTypeId: seq.ciltTypeId,
                ciltTypeName: seq.ciltTypeName,
                referenceOplSopId: seq.referenceOplSopId,
                remediationOplSopId: seq.remediationOplSopId ? Number(seq.remediationOplSopId) : null,
                toolsRequiered: seq.toolsRequired,
                selectableWithoutProgramming: Boolean(seq.selectableWithoutProgramming),
                status: 'A',
                stoppageReason: Boolean(seq.stoppageReason),
                machineStopped: Boolean(seq.machineStopped),
                duration: seq.standardTime,
                levelId: cpl.levelId,
                route: await this.levelService.getLevelPathById(cpl.levelId),
                allowExecuteBefore: Boolean(scheduleDetails?.allowExecuteBefore),
                allowExecuteBeforeMinutes: scheduleDetails?.allowExecuteBeforeMinutes || null,
                toleranceBeforeMinutes: scheduleDetails?.toleranceBeforeMinutes || null,
                toleranceAfterMinutes: scheduleDetails?.toleranceAfterMinutes || null,
                allowExecuteAfterDue: Boolean(scheduleDetails?.allowExecuteAfterDue),
                specialWarning: seq.specialWarning,
              };
              const created = await this.ciltSequencesExecutionsRepository.save(dto as CiltSequencesExecutionsEntity);
              this.logger.logProcess('CREATED CILT SEQUENCES EXECUTION', { id: created.id });
            }
          }
        }
      }

      // 9) Read all executions for the date
      const allExecutions = await this.ciltSequencesExecutionsRepository.find({
        where: {
          ciltId: In(ciltMasters.map(cm => cm.id)),
          status: 'A',
          deletedAt: IsNull(),
          secuenceSchedule: Between(dayStart, dayEnd),
        },
        relations: ['evidences', 'referenceOplSop', 'remediationOplSop'],
        order: { secuenceStart: 'ASC' },
      });
      this.logger.logProcess('CILT EXECUTIONS', allExecutions);

      // 10) Group sequences and executions
      const sequencesByMaster = new Map<number, CiltSequencesEntity[]>();
      ciltSequences.forEach(seq => {
        const list = sequencesByMaster.get(seq.ciltMstrId) ?? [];
        list.push(seq);
        sequencesByMaster.set(seq.ciltMstrId, list);
      });

      const executionsBySequence = new Map<number, CiltSequencesExecutionsEntity[]>();
      allExecutions.forEach(exec => {
        const list = executionsBySequence.get(exec.ciltSecuenceId) ?? [];
        list.push(exec);
        executionsBySequence.set(exec.ciltSecuenceId, list);
      });
      
      return {
        siteId,
        date,
        executions: allExecutions.map(exec => {
          const levelInfo = levelPaths.find(lp => lp.ciltMstrId === exec.ciltId);
          return {
            ...exec,
            levelId: levelInfo?.levelId,
            route: levelInfo?.route
          };
        }),
        total: allExecutions.length
      }
    } catch (error) {
      HandleException.exception(error);
    }
  }

  async cloneCiltMaster(id: number) {
    try {
      // 1. Find the original CILT master
      const originalCilt = await this.ciltRepository.findOne({
        where: { id },
        relations: ['sequences']
      });
      if (!originalCilt) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.CILT_MSTR);
      }

      // 2. Get the next available order for sequences
      const lastSequence = await this.ciltSequencesRepository.findOne({
        where: { siteId: originalCilt.siteId },
        order: { order: 'DESC' }
      });
      let nextSequenceOrder = lastSequence ? lastSequence.order + 1 : 1;

      // 3. Start a transaction
      const queryRunner = this.ciltRepository.manager.connection.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // 4. Create a new CILT master with the same data
        const { id: originalId, sequences, createdAt, updatedAt, deletedAt, ...ciltData } = originalCilt;
        const newCilt = this.ciltRepository.create({
          ...ciltData,
          ciltName: `${ciltData.ciltName} (Copy)`,
          order: await this.getNextOrder(ciltData.siteId)
        });
        const savedCilt = await queryRunner.manager.save(CiltMstrEntity, newCilt);

        // 5. Clone all sequences sequentially
        const clonedSequences = [];
        for (const sequence of sequences) {
          const { id: seqId, createdAt: seqCreatedAt, updatedAt: seqUpdatedAt, deletedAt: seqDeletedAt, ...seqData } = sequence;
          const newSequence = this.ciltSequencesRepository.create({
            ...seqData,
            ciltMstrId: savedCilt.id,
            order: nextSequenceOrder++
          });
          const savedSequence = await queryRunner.manager.save(CiltSequencesEntity, newSequence);
          clonedSequences.push(savedSequence);
        }

        // 6. Commit the transaction
        await queryRunner.commitTransaction();

        return {
          ciltMaster: savedCilt,
          sequences: clonedSequences
        };
      } catch (error) {
        // 7. Rollback in case of error
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        // 8. Release the query runner
        await queryRunner.release();
      }
    } catch (exception) {
      HandleException.exception(exception);
    }
  }

  private async getNextOrder(siteId: number): Promise<number> {
    const existingCilts = await this.ciltRepository.find({
      where: { siteId },
      order: { order: 'DESC' },
      take: 1
    });
    return existingCilts.length > 0 ? existingCilts[0].order + 1 : 1;
  }
}
