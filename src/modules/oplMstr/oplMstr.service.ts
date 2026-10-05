import { errorDiagnostics } from 'src/common/exceptions/error-details';
import { OplAccessPersistence } from './opl-access.persistence';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, QueryFailedError, Repository } from 'typeorm';
import { OplMstr } from './entities/oplMstr.entity';
import { CreateOplMstrDTO } from './models/dto/createOplMstr.dto';
import { UpdateOplMstrDTO } from './models/dto/updateOplMstr.dto';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';
import {
  NotFoundCustomException,
  NotFoundCustomExceptionType,
} from 'src/common/exceptions/types/notFound.exception';
import { OplLevelsEntity } from '../oplLevels/entities/oplLevels.entity';
import { OplDetailsEntity } from '../oplDetails/entities/oplDetails.entity';
import { OplUserAccessEntity } from './entities/oplUserAccess.entity';
import { LevelEntity } from '../level/entities/level.entity';
import { UpdateOplMstrOrderDTO } from './models/dto/update-order.dto';
import { OplMasterPersistence } from './opl-master.persistence';
import { MailService } from '../mail/mail.service';
import { UserEntity } from '../users/entities/user.entity';
import { FirebaseService } from '../firebase/firebase.service';
import { NotificationDTO } from '../firebase/models/firebase.request.dto';
import { stringConstants } from 'src/utils/string.constant';

@Injectable()
export class OplMstrService {
  private readonly logger = new Logger(OplMstrService.name);

  constructor(
    @InjectRepository(OplMstr)
    private readonly oplRepository: Repository<OplMstr>,
    @InjectRepository(OplLevelsEntity)
    private readonly oplLevelsRepository: Repository<OplLevelsEntity>,
    @InjectRepository(OplDetailsEntity)
    private readonly oplDetailsRepository: Repository<OplDetailsEntity>,
    @InjectRepository(OplUserAccessEntity)
    private readonly oplUserAccessRepository: Repository<OplUserAccessEntity>,
    @InjectRepository(LevelEntity)
    private readonly levelRepository: Repository<LevelEntity>,
    private readonly oplMasterPersistence: OplMasterPersistence,
    private readonly oplAccessPersistence: OplAccessPersistence,
    private readonly mailService: MailService,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly firebaseService: FirebaseService,
  ) {}

  findAll = async () => {
    try {
      const opls = await this.oplRepository.find();
      const oplIds = opls.map((opl) => opl.id);
      const details = await this.oplDetailsRepository.find({
        where: { oplId: In(oplIds) },
        order: { order: 'ASC' },
      });

      return opls.map((opl) => ({
        ...opl,
        details: details.filter((detail) => detail.oplId === opl.id),
      }));
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findByCreatorId = async (creatorId: number) => {
    try {
      const opls = await this.oplRepository.find({ where: { creatorId } });
      const oplIds = opls.map((opl) => opl.id);
      const details = await this.oplDetailsRepository.find({
        where: { oplId: In(oplIds) },
        order: { order: 'ASC' },
      });

      return opls.map((opl) => ({
        ...opl,
        details: details.filter((detail) => detail.oplId === opl.id),
      }));
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findById = async (id: number, userId?: number) => {
    try {
      const opl = await this.oplRepository.findOneBy({ id });
      if (!opl) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.OPL_MSTR);
      }
      const [hydratedOpl] = await this.attachDetailsAndLevels(
        [opl],
        Number(opl.siteId),
      );

      // Record this user's access to the OPL (best-effort; never block the read).
      if (userId) {
        this.recordUserAccess(Number(userId), opl).catch((e) =>
          this.logger.warn(`Failed to record OPL access: ${JSON.stringify(errorDiagnostics(e))}`),
        );
      }

      return hydratedOpl;
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  /**
   * Upserts the (user, opl) access row: first access inserts, subsequent ones
   * increment access_count and refresh last_access_at. Also bumps the global
   * direct_usage_count on the OPL so the list "times used" reflects every open.
   */
  private async recordUserAccess(userId: number, opl: OplMstr): Promise<void> {
    await this.oplAccessPersistence.record(userId, opl.id);
  }

  /**
   * Returns every OPL a user has accessed, with the OPL title, its node path
   * (built from opl_mstr_levels + levels), the access count and last access.
   */
  async findUserOplAccess(userId: number): Promise<any[]> {
    try {
      const accesses = await this.oplUserAccessRepository.find({
        where: { userId },
        order: { lastAccessAt: 'DESC' },
      });
      if (!accesses || accesses.length === 0) {
        return [];
      }

      const oplIds = [...new Set(accesses.map((a) => a.oplId))];
      const opls = await this.oplRepository.find({
        where: { id: In(oplIds) },
      });
      const oplMap = new Map(opls.map((o) => [Number(o.id), o]));

      // Resolve node path for each OPL via its first level assignment.
      const oplLevels = await this.oplLevelsRepository.find({
        where: { oplId: In(oplIds), deletedAt: IsNull() },
      });
      const firstLevelByOpl = new Map<number, number>();
      for (const ol of oplLevels) {
        if (!firstLevelByOpl.has(Number(ol.oplId))) {
          firstLevelByOpl.set(Number(ol.oplId), Number(ol.levelId));
        }
      }

      // Load all levels for the sites involved to build breadcrumb paths.
      const allLevels = await this.levelRepository.find({
        where: { deletedAt: IsNull() },
      });
      const levelById = new Map(allLevels.map((l) => [Number(l.id), l]));
      const buildPath = (levelId?: number): string | null => {
        if (!levelId) return null;
        const parts: string[] = [];
        const seen = new Set<number>();
        let current = levelById.get(Number(levelId));
        while (current && !seen.has(Number(current.id))) {
          seen.add(Number(current.id));
          parts.unshift(current.name);
          const sup = Number(current.superiorId);
          if (!sup || sup === 0) break;
          current = levelById.get(sup);
        }
        return parts.length ? parts.join(' › ') : null;
      };

      return accesses.map((a) => {
        const opl = oplMap.get(Number(a.oplId));
        const levelId = firstLevelByOpl.get(Number(a.oplId));
        return {
          oplId: a.oplId,
          title: opl?.title ?? null,
          oplTypeId: opl?.oplTypeId ?? null,
          path: buildPath(levelId),
          accessCount: a.accessCount,
          lastAccessAt: a.lastAccessAt,
        };
      });
    } catch (exception) {
      HandleException.exception(exception);
    }
  }

  findOplMstrBySiteId = async (siteId: number) => {
    try {
      const opls = await this.oplRepository.find({
        where: { siteId },
        order: { order: 'ASC' },
      });

      if (!opls || opls.length === 0) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.OPL_MSTR);
      }
      return await this.attachDetailsAndLevels(opls, siteId);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  searchByTitleOrLevelName = async (siteId: number, query: string) => {
    try {
      const normalizedQuery = query.trim().toLocaleLowerCase();
      const matches = await this.oplRepository
        .createQueryBuilder('opl')
        .leftJoin(
          OplLevelsEntity,
          'oplLevel',
          [
            'oplLevel.oplId = opl.id',
            'oplLevel.deletedAt IS NULL',
            '(oplLevel.siteId IS NULL OR oplLevel.siteId = :siteId)',
          ].join(' AND '),
          { siteId },
        )
        .leftJoin(
          'oplLevel.level',
          'level',
          'level.deletedAt IS NULL AND level.siteId = :siteId',
          { siteId },
        )
        .where('opl.siteId = :siteId', { siteId })
        .andWhere('opl.deletedAt IS NULL')
        .andWhere(
          '(LOWER(opl.title) LIKE :query OR LOWER(level.name) LIKE :query)',
          { query: `%${normalizedQuery}%` },
        )
        .select('opl.id', 'id')
        .distinct(true)
        .getRawMany<{ id: string | number }>();

      const oplIds = matches.map((match) => Number(match.id));
      if (oplIds.length === 0) {
        return [];
      }

      const opls = await this.oplRepository.find({
        where: {
          id: In(oplIds),
          siteId,
          deletedAt: IsNull(),
        },
        order: { order: 'ASC', id: 'ASC' },
      });

      return await this.attachDetailsAndLevels(opls, siteId);
    } catch (exception) {
      if (exception instanceof QueryFailedError) {
        this.logger.error({ event: 'opl.search.failed', siteId, ...errorDiagnostics(exception) });
      }
      HandleException.exception(exception);
    }
  };

  create = async (createOplDto: CreateOplMstrDTO, creatorId: number) => {
    try {
      const opl = await this.oplMasterPersistence.create(createOplDto, creatorId);
      await this.notifyReviewer(opl?.reviewerId ?? null, opl?.title ?? createOplDto.title);
      return opl;
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  private notifyReviewer = async (
    reviewerId: number | null,
    oplTitle: string,
  ) => {
    if (!reviewerId) {
      return;
    }
    const reviewer = await this.userRepository.findOneBy({ id: reviewerId });
    if (!reviewer) {
      this.logger.warn(
        `OPL reviewer ${reviewerId} not found; skipping notifications`,
      );
      return;
    }

    // Email notification (best-effort)
    try {
      if (reviewer.email) {
        await this.mailService.sendOplReviewerAssignmentEmail(reviewer, oplTitle);
      } else {
        this.logger.warn(
          `OPL reviewer ${reviewerId} has no email; skipping email notification`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to send OPL reviewer assignment email to user ${reviewerId}: ${error?.message ?? error}`,
      );
    }

    // Push notification (best-effort)
    try {
      const tokens = [
        reviewer.androidToken
          ? { token: reviewer.androidToken, type: stringConstants.OS_ANDROID }
          : null,
        reviewer.iosToken
          ? { token: reviewer.iosToken, type: stringConstants.OS_IOS }
          : null,
        reviewer.webToken
          ? { token: reviewer.webToken, type: stringConstants.OS_WEB }
          : null,
      ].filter((item) => item !== null) as { token: string; type: string }[];

      if (tokens.length > 0) {
        await this.firebaseService.sendMultipleMessage(
          new NotificationDTO(
            stringConstants.oplReviewNotificationTitle,
            `${stringConstants.emailTemplates[stringConstants.LANG_ES].oplReviewAssignment.message} ${oplTitle}`,
            stringConstants.oplReviewNotificationType,
          ),
          tokens,
        );
      } else {
        this.logger.warn(
          `OPL reviewer ${reviewerId} has no push tokens; skipping push notification`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to send OPL reviewer assignment push to user ${reviewerId}: ${error?.message ?? error}`,
      );
    }
  };

  update = async (updateOplDto: UpdateOplMstrDTO) => {
    try {
      const previous = await this.oplRepository.findOneBy({ id: updateOplDto.id });
      const previousReviewerId = previous?.reviewerId ?? null;
      const updated = await this.oplMasterPersistence.update(updateOplDto);
      const newReviewerId = updated?.reviewerId ?? null;
      if (newReviewerId && newReviewerId !== previousReviewerId) {
        await this.notifyReviewer(
          newReviewerId,
          updated?.title ?? previous?.title ?? '',
        );
      }
      return updated;
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  updateOrder = async (updateOrderDto: UpdateOplMstrOrderDTO) => {
    try {
      return await this.oplMasterPersistence.updateOrder(updateOrderDto);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  delete = async (id: number) => {
    try {
      return await this.oplMasterPersistence.delete(id);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  private async attachDetailsAndLevels(opls: OplMstr[], siteId: number) {
    if (opls.length === 0) {
      return [];
    }

    const oplIds = opls.map((opl) => opl.id);
    const [details, assignments] = await Promise.all([
      this.oplDetailsRepository.find({
        where: [
          { oplId: In(oplIds), siteId, deletedAt: IsNull() },
          { oplId: In(oplIds), siteId: IsNull(), deletedAt: IsNull() },
        ],
        order: { order: 'ASC', id: 'ASC' },
      }),
      this.oplLevelsRepository.find({
        where: {
          oplId: In(oplIds),
          deletedAt: IsNull(),
        },
        relations: ['level'],
      }),
    ]);

    const assignmentsByOplId = new Map<number, OplLevelsEntity[]>();
    assignments.forEach((assignment) => {
      const level = assignment.level;
      const relationSiteId = assignment.siteId ?? level?.siteId;
      if (
        !level ||
        level.deletedAt != null ||
        Number(level.siteId) !== Number(siteId) ||
        Number(relationSiteId) !== Number(siteId)
      ) {
        return;
      }

      const currentAssignments = assignmentsByOplId.get(assignment.oplId) ?? [];
      currentAssignments.push(assignment);
      assignmentsByOplId.set(assignment.oplId, currentAssignments);
    });

    return opls.map((opl) => ({
      ...opl,
      details: details.filter((detail) => detail.oplId === opl.id),
      levels: (assignmentsByOplId.get(opl.id) ?? [])
        .sort((left, right) => {
          const levelDifference = left.level.level - right.level.level;
          return levelDifference !== 0
            ? levelDifference
            : left.level.name.localeCompare(right.level.name);
        })
        .map((assignment) => ({
          oplLevelId: assignment.id,
          id: assignment.level.id,
          name: assignment.level.name,
          description: assignment.level.description,
          levelMachineId: assignment.level.levelMachineId,
          level: assignment.level.level,
          superiorId: assignment.level.superiorId,
        })),
    }));
  }
}
