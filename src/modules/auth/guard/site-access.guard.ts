import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  PLATFORM_ADMIN_ROLE,
  normalizeRole,
} from 'src/common/auth/roles.constants';
import { IS_PUBLIC_KEY } from 'src/common/decorators/public.decorator';
import {
  SITE_RESOURCE_ACCESS_KEY,
  SiteResourceAccessMetadata,
  SiteResourceAccessOptions,
  SiteResourceType,
} from 'src/common/decorators/site-resource-access.decorator';
import { CardTypesEntity } from 'src/modules/cardTypes/entities/cardTypes.entity';
import { CardEntity } from 'src/modules/card/entities/card.entity';
import { Chart } from 'src/modules/charts/entities/chart.entity';
import { AmDiscardReasonEntity } from 'src/modules/amDiscardReason/entities/am-discard-reason.entity';
import { CiltFrequenciesEntity } from 'src/modules/ciltFrequencies/entities/ciltFrequencies.entity';
import { CiltSequencesExecutionsEntity } from 'src/modules/CiltSequencesExecutions/entities/ciltSequencesExecutions.entity';
import { CiltSequencesExecutionsEvidencesEntity } from 'src/modules/CiltSequencesExecutionsEvidences/entities/ciltSequencesExecutionsEvidences.entity';
import { CiltMstrEntity } from 'src/modules/ciltMstr/entities/ciltMstr.entity';
import { CiltMstrPositionLevelsEntity } from 'src/modules/ciltMstrPositionLevels/entities/ciltMstrPositionLevels.entity';
import { CiltSequencesEntity } from 'src/modules/ciltSequences/entities/ciltSequences.entity';
import { CiltSecuencesScheduleEntity } from 'src/modules/ciltSecuencesSchedule/entities/ciltSecuencesSchedule.entity';
import { CiltTypesEntity } from 'src/modules/ciltTypes/entities/ciltTypes.entity';
import { LevelEntity } from 'src/modules/level/entities/level.entity';
import { OplDetailsEntity } from 'src/modules/oplDetails/entities/oplDetails.entity';
import { OplLevelsEntity } from 'src/modules/oplLevels/entities/oplLevels.entity';
import { OplMstr } from 'src/modules/oplMstr/entities/oplMstr.entity';
import { OplTypes } from 'src/modules/oplTypes/entities/oplTypes.entity';
import { PositionEntity } from 'src/modules/position/entities/position.entity';
import { PreclassifierEntity } from 'src/modules/preclassifier/entities/preclassifier.entity';
import { PriorityEntity } from 'src/modules/priority/entities/priority.entity';
import { SiteEntity } from 'src/modules/site/entities/site.entity';
import { UsersService } from 'src/modules/users/users.service';
import { DataSource, EntityTarget } from 'typeorm';

export const SKIP_SITE_ACCESS_KEY = 'skipSiteAccess';
export const REQUIRE_SITE_ACCESS_KEY = 'requireSiteAccess';

type SiteOwnedResource = {
  id: number;
  siteId: number | null;
};

const SITE_OWNED_RESOURCE_ENTITIES: Partial<
  Record<SiteResourceType, EntityTarget<SiteOwnedResource>>
> = {
  cardType: CardTypesEntity,
  ciltFrequency: CiltFrequenciesEntity,
  ciltExecution: CiltSequencesExecutionsEntity,
  ciltMaster: CiltMstrEntity,
  ciltPositionLevel: CiltMstrPositionLevelsEntity,
  ciltSchedule: CiltSecuencesScheduleEntity,
  ciltSequence: CiltSequencesEntity,
  ciltType: CiltTypesEntity,
  discardReason: AmDiscardReasonEntity,
  level: LevelEntity,
  oplMaster: OplMstr,
  oplType: OplTypes,
  position: PositionEntity,
  preclassifier: PreclassifierEntity,
  priority: PriorityEntity,
};

@Injectable()
export class SiteAccessGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private usersService: UsersService,
    private dataSource: DataSource,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const skipSiteAccess = this.reflector.getAllAndOverride<boolean>(
      SKIP_SITE_ACCESS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (skipSiteAccess) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id) {
      throw new UnauthorizedException('User not authenticated');
    }

    const siteIds = this.extractSiteIds(request);
    const resourceAccessMetadata =
      this.reflector.getAllAndOverride<SiteResourceAccessMetadata>(
        SITE_RESOURCE_ACCESS_KEY,
        [context.getHandler(), context.getClass()],
      );

    if (resourceAccessMetadata) {
      const resourceAccesses = Array.isArray(resourceAccessMetadata)
        ? resourceAccessMetadata
        : [resourceAccessMetadata];

      for (const resourceAccess of resourceAccesses) {
        const resourceId =
          request[resourceAccess.source]?.[resourceAccess.requestKey];
        if (
          resourceAccess.required === false &&
          (resourceId === undefined || resourceId === null || resourceId === '')
        ) {
          continue;
        }

        const resourceSiteIds = await this.resolveResourceSiteIds(
          request,
          resourceAccess,
        );
        if (resourceSiteIds.length === 0) {
          if (await this.hasGlobalSiteAccess(user.id)) {
            continue;
          }
          throw new ForbiddenException('Resource has no accessible site');
        }
        siteIds.push(...resourceSiteIds);
      }
    }

    if (siteIds.length === 0) {
      const requireSiteAccess = this.reflector.getAllAndOverride<boolean>(
        REQUIRE_SITE_ACCESS_KEY,
        [context.getHandler(), context.getClass()],
      );
      if (requireSiteAccess) {
        if (await this.hasGlobalSiteAccess(user.id)) {
          return true;
        }
        throw new BadRequestException('siteId is required');
      }
      return true;
    }

    await this.validateSiteAccess(siteIds, user.id);

    return true;
  }

  private extractSiteIds(request: any): number[] {
    const rawSiteIds: unknown[] = [];

    this.collectSiteIds(request.params, rawSiteIds);
    this.collectSiteIds(request.query, rawSiteIds);
    this.collectSiteIds(request.body, rawSiteIds);

    return [
      ...new Set(rawSiteIds.flatMap((value) => this.parseSiteIds(value))),
    ];
  }

  private collectSiteIds(value: unknown, siteIds: unknown[], depth = 0): void {
    if (!value || typeof value !== 'object' || depth > 5) {
      return;
    }

    for (const [key, nestedValue] of Object.entries(value)) {
      const normalizedKey = key.replace(/[_-]/g, '').toLowerCase();

      if (
        normalizedKey === 'siteid' ||
        normalizedKey === 'siteids' ||
        normalizedKey === 'sitesids'
      ) {
        siteIds.push(nestedValue);
        continue;
      }

      this.collectSiteIds(nestedValue, siteIds, depth + 1);
    }
  }

  private parseSiteIds(value: unknown): number[] {
    const values = Array.isArray(value) ? value : [value];

    return values.map((rawValue) => {
      const siteId =
        typeof rawValue === 'number'
          ? rawValue
          : Number(String(rawValue).trim());

      if (!Number.isSafeInteger(siteId) || siteId <= 0) {
        throw new BadRequestException('Invalid siteId');
      }

      return siteId;
    });
  }

  private async resolveResourceSiteIds(
    request: any,
    options: SiteResourceAccessOptions,
  ): Promise<number[]> {
    const resourceId = request[options.source]?.[options.requestKey];

    if (resourceId === undefined || resourceId === null || resourceId === '') {
      throw new BadRequestException(
        `${options.requestKey} is required for site authorization`,
      );
    }

    if (options.resource === 'card') {
      const repository = this.dataSource.getRepository(CardEntity);
      const where =
        options.lookup === 'uuid'
          ? { cardUUID: String(resourceId) }
          : { id: this.parseResourceId(resourceId, options.requestKey) };

      const resource = await repository.findOne({
        select: { siteId: true },
        where,
      });

      if (!resource) {
        throw new NotFoundException('Resource not found');
      }

      return [Number(resource.siteId)];
    }

    if (options.resource === 'chart') {
      if (options.lookup !== 'id') {
        throw new BadRequestException('Unsupported chart lookup');
      }

      const resource = await this.dataSource.getRepository(Chart).findOne({
        select: { siteId: true },
        where: { id: this.parseResourceId(resourceId, options.requestKey) },
      });

      if (!resource) {
        throw new NotFoundException('Resource not found');
      }

      return [Number(resource.siteId)];
    }

    if (
      options.resource === 'oplDetail' ||
      options.resource === 'oplLevel'
    ) {
      if (options.lookup !== 'id') {
        throw new BadRequestException('Unsupported resource lookup');
      }

      const id = this.parseResourceId(resourceId, options.requestKey);
      const resource =
        options.resource === 'oplDetail'
          ? await this.dataSource.getRepository(OplDetailsEntity).findOne({
              select: { siteId: true, oplId: true },
              where: { id },
            })
          : await this.dataSource.getRepository(OplLevelsEntity).findOne({
              select: { siteId: true, oplId: true },
              where: { id },
            });

      if (!resource) {
        throw new NotFoundException('Resource not found');
      }
      if (resource.siteId !== null) {
        return [Number(resource.siteId)];
      }

      const parent = await this.dataSource.getRepository(OplMstr).findOne({
        select: { siteId: true },
        where: { id: Number(resource.oplId) },
      });

      return parent?.siteId === null || parent?.siteId === undefined
        ? []
        : [Number(parent.siteId)];
    }

    if (options.resource === 'ciltEvidence') {
      if (options.lookup !== 'id') {
        throw new BadRequestException('Unsupported resource lookup');
      }

      const evidence = await this.dataSource
        .getRepository(CiltSequencesExecutionsEvidencesEntity)
        .findOne({
          select: { siteId: true, ciltSequencesExecutionsId: true },
          where: {
            id: this.parseResourceId(resourceId, options.requestKey),
          },
        });
      if (!evidence) {
        throw new NotFoundException('Resource not found');
      }
      if (evidence.siteId !== null) {
        return [Number(evidence.siteId)];
      }

      const execution = await this.dataSource
        .getRepository(CiltSequencesExecutionsEntity)
        .findOne({
          select: { siteId: true },
          where: { id: Number(evidence.ciltSequencesExecutionsId) },
        });

      return execution?.siteId === null || execution?.siteId === undefined
        ? []
        : [Number(execution.siteId)];
    }

    const siteOwnedResourceEntity =
      SITE_OWNED_RESOURCE_ENTITIES[options.resource];
    if (siteOwnedResourceEntity) {
      if (options.lookup !== 'id') {
        throw new BadRequestException('Unsupported resource lookup');
      }

      const resource = await this.dataSource
        .getRepository(siteOwnedResourceEntity)
        .findOne({
          select: { siteId: true },
          where: {
            id: this.parseResourceId(resourceId, options.requestKey),
          },
        });

      if (!resource) {
        throw new NotFoundException('Resource not found');
      }

      return resource.siteId === null ? [] : [Number(resource.siteId)];
    }

    const id = this.parseResourceId(resourceId, options.requestKey);

    if (options.resource === 'site') {
      const resource = await this.dataSource.getRepository(SiteEntity).findOne({
        select: { id: true },
        where: { id },
      });

      if (!resource) {
        throw new NotFoundException('Resource not found');
      }

      return [Number(resource.id)];
    }

    const user = await this.usersService.findByIdWithSites(id);
    if (!user) {
      throw new NotFoundException('Resource not found');
    }

    return [
      ...new Set(
        (user.userHasSites ?? []).map((userSite) => Number(userSite.site.id)),
      ),
    ];
  }

  private parseResourceId(value: unknown, key: string): number {
    const id = typeof value === 'number' ? value : Number(String(value).trim());

    if (!Number.isSafeInteger(id) || id <= 0) {
      throw new BadRequestException(`Invalid ${key}`);
    }

    return id;
  }

  private async validateSiteAccess(
    siteIds: number[],
    userId: number,
  ): Promise<void> {
    if (await this.hasGlobalSiteAccess(userId)) {
      return;
    }

    const authUser = await this.usersService.findByIdWithSites(userId);
    if (!authUser) {
      throw new UnauthorizedException('User not found');
    }

    if (!authUser.userHasSites?.length) {
      throw new UnauthorizedException('User has no site access');
    }

    const allowedSiteIds = new Set(
      authUser.userHasSites.map((userSite) => Number(userSite.site.id)),
    );
    const hasAccessToAllSites = siteIds.every((siteId) =>
      allowedSiteIds.has(siteId),
    );

    if (!hasAccessToAllSites) {
      throw new ForbiddenException('Site access denied');
    }
  }

  private async hasGlobalSiteAccess(userId: number): Promise<boolean> {
    const userRoles = await this.usersService.getUserRoles(userId);

    return userRoles.some(
      (role) => normalizeRole(role) === PLATFORM_ADMIN_ROLE,
    );
  }
}
