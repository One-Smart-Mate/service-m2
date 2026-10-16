import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, LessThanOrEqual, Repository } from 'typeorm';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';
import {
  NotFoundCustomException,
  NotFoundCustomExceptionType,
} from 'src/common/exceptions/types/notFound.exception';
import { OplMstr } from 'src/modules/oplMstr/entities/oplMstr.entity';
import { PositionEntity } from 'src/modules/position/entities/position.entity';
import { UserEntity } from 'src/modules/users/entities/user.entity';
import { UsersPositionsEntity } from 'src/modules/users/entities/users.positions.entity';
import { MailService } from 'src/modules/mail/mail.service';
import { CustomLoggerService } from 'src/common/logger/logger.service';
import { stringConstants } from 'src/utils/string.constant';
import { OplPositionAssignmentEntity } from './entities/oplPositionAssignment.entity';
import {
  OplTrainingRecordEntity,
  OplTrainingStatus,
} from './entities/oplTrainingRecord.entity';
import { AssignOplToPositionDTO } from './models/dto/assignOplToPosition.dto';
import { ValidateTrainingDTO } from './models/dto/validateTraining.dto';

@Injectable()
export class OplTrainingService {
  constructor(
    @InjectRepository(OplPositionAssignmentEntity)
    private readonly assignmentRepository: Repository<OplPositionAssignmentEntity>,
    @InjectRepository(OplTrainingRecordEntity)
    private readonly recordRepository: Repository<OplTrainingRecordEntity>,
    @InjectRepository(OplMstr)
    private readonly oplRepository: Repository<OplMstr>,
    @InjectRepository(PositionEntity)
    private readonly positionRepository: Repository<PositionEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(UsersPositionsEntity)
    private readonly usersPositionsRepository: Repository<UsersPositionsEntity>,
    private readonly mailService: MailService,
    private readonly logger: CustomLoggerService,
  ) {}

  // ---------------------------------------------------------------------------
  // Assignment: OPL (course) required for a position
  // ---------------------------------------------------------------------------

  /**
   * Assigns an OPL to a position and materializes a PENDING training record
   * for every active user that belongs to that position (so the user sees the
   * course as required). Idempotent: re-assigning returns the existing link.
   */
  async assignOplToPosition(dto: AssignOplToPositionDTO) {
    try {
      const opl = await this.oplRepository.findOne({
        where: { id: dto.oplId, deletedAt: IsNull() },
      });
      if (!opl) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.OPL_MSTR);
      }

      const position = await this.positionRepository.findOne({
        where: { id: dto.positionId, deletedAt: IsNull() },
      });
      if (!position) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.POSITION);
      }

      if (Number(opl.siteId) !== Number(position.siteId)) {
        throw new BadRequestException(
          'The OPL and position must belong to the same site',
        );
      }

      let assignment = await this.assignmentRepository.findOne({
        where: {
          oplId: opl.id,
          positionId: position.id,
          deletedAt: IsNull(),
        },
      });
      if (!assignment) {
        assignment = await this.assignmentRepository.save(
          this.assignmentRepository.create({
            siteId: opl.siteId,
            oplId: opl.id,
            positionId: position.id,
          }),
        );
      }

      await this.syncRecordsForAssignment(opl, position.id);
      return assignment;
    } catch (exception) {
      HandleException.exception(exception);
    }
  }

  /**
   * Creates a PENDING training record for each active user in the position
   * that does not have a live record for this OPL yet.
   */
  private async syncRecordsForAssignment(opl: OplMstr, positionId: number) {
    const userLinks = await this.usersPositionsRepository.find({
      where: { positionId, deletedAt: IsNull() },
    });
    const userIds = [
      ...new Set(userLinks.map((l) => Number(l.userId)).filter(Boolean)),
    ];
    if (userIds.length === 0) return;

    const users = await this.userRepository.find({
      where: { id: In(userIds) },
    });
    const activeUserIds = users
      .filter((u) => u.status === 'A' || u.status === undefined)
      .map((u) => u.id);

    for (const userId of activeUserIds) {
      const existing = await this.recordRepository.findOne({
        where: { oplId: opl.id, userId, deletedAt: IsNull() },
      });
      if (existing) continue;
      await this.recordRepository.save(
        this.recordRepository.create({
          siteId: opl.siteId,
          oplId: opl.id,
          userId,
          positionId,
          status: OplTrainingStatus.PENDING,
        }),
      );
    }
  }

  /** Removes an OPL<->position assignment (soft). Records are kept for history. */
  async removeAssignment(id: number) {
    try {
      const assignment = await this.assignmentRepository.findOne({
        where: { id },
      });
      if (!assignment) {
        throw new NotFoundCustomException(
          NotFoundCustomExceptionType.OPL_MSTR,
        );
      }
      await this.assignmentRepository.softDelete({ id });
    } catch (exception) {
      HandleException.exception(exception);
    }
  }

  /** Lists the positions an OPL is assigned to. */
  async findPositionsByOpl(oplId: number) {
    try {
      const assignments = await this.assignmentRepository.find({
        where: { oplId, deletedAt: IsNull() },
      });
      if (assignments.length === 0) return [];

      const positionIds = [...new Set(assignments.map((a) => a.positionId))];
      const positions = await this.positionRepository.find({
        where: { id: In(positionIds) },
      });
      const positionMap = new Map(positions.map((p) => [Number(p.id), p]));

      return assignments.map((a) => {
        const position = positionMap.get(Number(a.positionId));
        return {
          id: a.id,
          oplId: a.oplId,
          positionId: a.positionId,
          siteId: a.siteId,
          position: position
            ? { id: position.id, name: position.name, route: position.route }
            : null,
        };
      });
    } catch (exception) {
      HandleException.exception(exception);
    }
  }

  // ---------------------------------------------------------------------------
  // User flow: mark as taken (self-complete)
  // ---------------------------------------------------------------------------

  /** The user declares they took the OPL -> SELF_COMPLETED, pending validation. */
  async selfComplete(userId: number, oplId: number) {
    try {
      const record = await this.recordRepository.findOne({
        where: { userId, oplId, deletedAt: IsNull() },
      });
      if (!record) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.OPL_MSTR);
      }
      record.status = OplTrainingStatus.SELF_COMPLETED;
      record.selfCompletedAt = new Date();
      // reset validation / expiry until the supervisor validates again
      record.validatedAt = null;
      record.validatedBy = null;
      record.expiresAt = null;
      record.expiryNotifiedAt = null;
      return await this.recordRepository.save(record);
    } catch (exception) {
      HandleException.exception(exception);
    }
  }

  // ---------------------------------------------------------------------------
  // Supervisor flow: validate
  // ---------------------------------------------------------------------------

  /**
   * Supervisor validates one or more records. Sets VALIDATED and computes
   * expires_at from the OPL validity (validity_days). NULL validity = no expiry.
   */
  async validate(dto: ValidateTrainingDTO, validatedBy: number) {
    try {
      const records = await this.recordRepository.find({
        where: { id: In(dto.recordIds), deletedAt: IsNull() },
      });
      if (records.length === 0) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.OPL_MSTR);
      }

      const oplIds = [...new Set(records.map((r) => r.oplId))];
      const opls = await this.oplRepository.find({
        where: { id: In(oplIds) },
      });
      const oplMap = new Map(opls.map((o) => [Number(o.id), o]));

      const now = new Date();
      for (const record of records) {
        const opl = oplMap.get(Number(record.oplId));
        record.status = OplTrainingStatus.VALIDATED;
        record.validatedAt = now;
        record.validatedBy = validatedBy;
        record.expiryNotifiedAt = null;
        const validityDays = Number((opl as any)?.validityDays ?? 0);
        if (validityDays > 0) {
          const expires = new Date(now);
          expires.setDate(expires.getDate() + validityDays);
          record.expiresAt = expires;
        } else {
          record.expiresAt = null;
        }
      }
      return await this.recordRepository.save(records);
    } catch (exception) {
      HandleException.exception(exception);
    }
  }

  // ---------------------------------------------------------------------------
  // Matrix / reading
  // ---------------------------------------------------------------------------

  /**
   * Training matrix for a site: one entry per training record, enriched with
   * user and OPL info so the frontend can render rows (users) x columns (OPLs).
   */
  async getMatrixBySite(siteId: number) {
    try {
      const records = await this.recordRepository.find({
        where: { siteId, deletedAt: IsNull() },
      });
      if (records.length === 0) {
        return { users: [], opls: [], records: [] };
      }

      const userIds = [...new Set(records.map((r) => r.userId))];
      const oplIds = [...new Set(records.map((r) => r.oplId))];

      const [users, opls] = await Promise.all([
        this.userRepository.find({ where: { id: In(userIds) } }),
        this.oplRepository.find({ where: { id: In(oplIds) } }),
      ]);

      const userList = users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
      }));
      const oplList = opls.map((o) => ({
        id: o.id,
        title: o.title,
        validityDays: Number((o as any).validityDays ?? 0) || null,
      }));

      const recordList = records.map((r) => ({
        id: r.id,
        oplId: r.oplId,
        userId: r.userId,
        positionId: r.positionId,
        status: r.status,
        selfCompletedAt: r.selfCompletedAt,
        validatedAt: r.validatedAt,
        validatedBy: r.validatedBy,
        expiresAt: r.expiresAt,
      }));

      return { users: userList, opls: oplList, records: recordList };
    } catch (exception) {
      HandleException.exception(exception);
    }
  }

  /** Training records for a single user (what each user sees on their side). */
  async getRecordsByUser(userId: number) {
    try {
      const records = await this.recordRepository.find({
        where: { userId, deletedAt: IsNull() },
      });
      if (records.length === 0) return [];

      const oplIds = [...new Set(records.map((r) => r.oplId))];
      const opls = await this.oplRepository.find({ where: { id: In(oplIds) } });
      const oplMap = new Map(opls.map((o) => [Number(o.id), o]));

      return records.map((r) => {
        const opl = oplMap.get(Number(r.oplId));
        return {
          id: r.id,
          oplId: r.oplId,
          status: r.status,
          selfCompletedAt: r.selfCompletedAt,
          validatedAt: r.validatedAt,
          expiresAt: r.expiresAt,
          opl: opl
            ? { id: opl.id, title: opl.title, objetive: opl.objetive }
            : null,
        };
      });
    } catch (exception) {
      HandleException.exception(exception);
    }
  }

  // ---------------------------------------------------------------------------
  // Expiry processing (called by the daily cron)
  // ---------------------------------------------------------------------------

  /**
   * Finds VALIDATED records whose expires_at has passed, flips them to EXPIRED
   * and emails each affected user with the course info. Idempotent per run via
   * expiry_notified_at. Returns a small summary for logging.
   */
  async processExpiredTraining(): Promise<{
    expired: number;
    emailed: number;
  }> {
    const now = new Date();
    let expired = 0;
    let emailed = 0;

    const dueRecords = await this.recordRepository.find({
      where: {
        status: OplTrainingStatus.VALIDATED,
        expiresAt: LessThanOrEqual(now),
        deletedAt: IsNull(),
      },
    });
    if (dueRecords.length === 0) return { expired, emailed };

    const oplIds = [...new Set(dueRecords.map((r) => r.oplId))];
    const userIds = [...new Set(dueRecords.map((r) => r.userId))];
    const [opls, users] = await Promise.all([
      this.oplRepository.find({ where: { id: In(oplIds) } }),
      this.userRepository.find({ where: { id: In(userIds) } }),
    ]);
    const oplMap = new Map(opls.map((o) => [Number(o.id), o]));
    const userMap = new Map(users.map((u) => [Number(u.id), u]));

    for (const record of dueRecords) {
      record.status = OplTrainingStatus.EXPIRED;
      await this.recordRepository.save(record);
      expired++;

      const user = userMap.get(Number(record.userId));
      const opl = oplMap.get(Number(record.oplId));
      if (!user?.email || !opl) continue;

      const expiredOn = (record.expiresAt ?? now)
        .toISOString()
        .slice(0, 10);
      try {
        await this.mailService.sendOplExpiredTrainingEmail(
          { email: user.email, name: user.name },
          opl.title,
          opl.objetive ?? null,
          expiredOn,
          stringConstants.LANG_ES,
        );
        record.expiryNotifiedAt = new Date();
        await this.recordRepository.save(record);
        emailed++;
      } catch (error) {
        this.logger.logException(
          'OplTrainingService',
          'processExpiredTraining',
          error,
        );
      }
    }

    return { expired, emailed };
  }
}
