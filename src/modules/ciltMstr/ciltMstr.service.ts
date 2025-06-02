import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull, Equal, Raw } from 'typeorm';
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
import { CustomLoggerService } from 'src/common/logger/logger.service';
import { CiltMstrPositionLevelsEntity } from '../ciltMstrPositionLevels/entities/ciltMstrPositionLevels.entity';
import { OplMstr } from '../oplMstr/entities/oplMstr.entity';

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
    private readonly logger: CustomLoggerService,
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

  async findCiltsByUserId(userId: number, date: string) {
    try {
      // Change date to midnight local
      const scheduleDate = new Date(date);
  
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
        relations: ['ciltMstr'],
      });
      this.logger.logProcess('CILT POSITION LEVELS', ciltPositionLevels);
  
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
      const scheduledSequences = await this.ciltSecuencesScheduleService.findSchedulesForDateSimplified(date);
      this.logger.logProcess('SCHEDULED SEQUENCES', scheduledSequences);
  
      // 8) Upsert executions
      for (const cpl of ciltPositionLevels) {
        const masterId = cpl.ciltMstr.id;
        for (const seq of ciltSequences.filter(s => s.ciltMstrId === masterId)) {
          const isScheduled = scheduledSequences.some(
            sch => sch.ciltId === masterId && sch.secuenceId === seq.id
          );
          if (!isScheduled) continue;
  
          const existing = await this.ciltSequencesExecutionsRepository.findOne({
            where: {
              ciltId: masterId,
              ciltSecuenceId: seq.id,
              secuenceSchedule: scheduleDate,
              status: 'A',
              deletedAt: IsNull(),
            }
          });
  
          if (existing) {
            await this.ciltSequencesExecutionsRepository.save(existing);
            this.logger.logProcess('UPDATED CILT SEQUENCES EXECUTION', { id: existing.id });
          } else {
            const dto: Partial<CiltSequencesExecutionsEntity> = {
              siteId: cpl.siteId,
              positionId: cpl.positionId,
              ciltId: masterId,
              ciltSecuenceId: seq.id,
              userId: user.id,
              userWhoExecutedId: user.id,
              secuenceSchedule: scheduleDate,
              standardOk: seq.standardOk,
              referencePoint: seq.referencePoint,
              secuenceList: seq.secuenceList,
              secuenceColor: seq.secuenceColor,
              ciltTypeId: seq.ciltTypeId,
              ciltTypeName: seq.ciltTypeName,
              referenceOplSopId: seq.referenceOplSopId,
              remediationOplSopId: seq.remediationOplSopId ? Number(seq.remediationOplSopId) : null,
              toolsRequiered: seq.toolsRequired,
              selectableWithoutProgramming: seq.selectableWithoutProgramming,
              status: 'A',
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
          secuenceSchedule: scheduleDate,
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
            const sequences = (sequencesByMaster.get(master.id) ?? []).map(seq => {
              // Extract only seq fields, without ciltMstr relation
              const { ciltMstr, ...seqFields } = seq as any;
              const executions = (executionsBySequence.get(seq.id) ?? [])
                .sort((a, b) => new Date(a.secuenceSchedule).getTime() - new Date(b.secuenceSchedule).getTime());
              return { ...seqFields, executions };
            });
            return { ...master, sequences };
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
        relations: ['position'],
      });
      this.logger.logProcess('CILT POSITION LEVELS', ciltPositionLevels);

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
      const scheduledSequences = await this.ciltSecuencesScheduleService.findSchedulesForDateSimplified(date);
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

            const existing = await this.ciltSequencesExecutionsRepository.findOne({
              where: {
                ciltId: masterId,
                ciltSecuenceId: seq.id,
                secuenceSchedule: scheduleDate,
                userId: user.id,
                status: 'A',
                deletedAt: IsNull(),
              }
            });

            if (existing) {
              await this.ciltSequencesExecutionsRepository.save(existing);
              this.logger.logProcess('UPDATED CILT SEQUENCES EXECUTION', { id: existing.id });
            } else {
              const dto: Partial<CiltSequencesExecutionsEntity> = {
                siteId: cpl.siteId,
                positionId: cpl.positionId,
                ciltId: masterId,
                ciltSecuenceId: seq.id,
                userId: user.id,
                userWhoExecutedId: user.id,
                secuenceSchedule: scheduleDate,
                standardOk: seq.standardOk,
                referencePoint: seq.referencePoint,
                secuenceList: seq.secuenceList,
                secuenceColor: seq.secuenceColor,
                ciltTypeId: seq.ciltTypeId,
                ciltTypeName: seq.ciltTypeName,
                referenceOplSopId: seq.referenceOplSopId,
                remediationOplSopId: seq.remediationOplSopId ? Number(seq.remediationOplSopId) : null,
                toolsRequiered: seq.toolsRequired,
                selectableWithoutProgramming: seq.selectableWithoutProgramming,
                status: 'A',
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
          secuenceSchedule: scheduleDate,
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
        executions: allExecutions,
        total: allExecutions.length
      }
    } catch (error) {
      HandleException.exception(error);
    }
  }
}
