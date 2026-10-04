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
  CILT_EXECUTION_OWNER_KEY,
  CiltExecutionOwnerOptions,
} from 'src/common/decorators/cilt-execution-owner.decorator';
import {
  SITE_ADMIN_ROLES,
  normalizeRole,
} from 'src/common/auth/roles.constants';
import { CiltSequencesExecutionsEntity } from 'src/modules/CiltSequencesExecutions/entities/ciltSequencesExecutions.entity';
import { CiltSequencesExecutionsEvidencesEntity } from 'src/modules/CiltSequencesExecutionsEvidences/entities/ciltSequencesExecutionsEvidences.entity';
import { UsersService } from 'src/modules/users/users.service';
import { DataSource } from 'typeorm';

@Injectable()
export class CiltExecutionOwnerGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly usersService: UsersService,
    private readonly dataSource: DataSource,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.getAllAndOverride<CiltExecutionOwnerOptions>(
      CILT_EXECUTION_OWNER_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!options) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userId = Number(request.user?.id);
    if (!Number.isSafeInteger(userId) || userId <= 0) {
      throw new UnauthorizedException('User not authenticated');
    }

    const roles = (await this.usersService.getUserRoles(userId)).map(
      normalizeRole,
    );
    if (SITE_ADMIN_ROLES.some((role) => roles.includes(role))) {
      return true;
    }

    if (options.resource === 'newExecution') {
      const requestedOwnerId = this.parseId(
        request[options.source]?.[options.requestKey],
        options.requestKey,
      );
      if (requestedOwnerId !== userId) {
        throw new ForbiddenException('Execution access denied');
      }
      this.validateRequestedOwners(request.body, userId);
      return true;
    }

    const resourceId = this.parseId(
      request[options.source]?.[options.requestKey],
      options.requestKey,
    );
    const executionId =
      options.resource === 'evidence'
        ? await this.resolveEvidenceExecutionId(resourceId)
        : resourceId;
    const execution = await this.dataSource
      .getRepository(CiltSequencesExecutionsEntity)
      .findOne({
        select: { userId: true, userWhoExecutedId: true },
        where: { id: executionId },
      });

    if (!execution) {
      throw new NotFoundException('Execution not found');
    }
    if (
      Number(execution.userId) !== userId &&
      Number(execution.userWhoExecutedId) !== userId
    ) {
      throw new ForbiddenException('Execution access denied');
    }

    this.validateRequestedOwners(request.body, userId);
    return true;
  }

  private validateRequestedOwners(body: unknown, userId: number): void {
    if (!body || typeof body !== 'object') {
      return;
    }

    const values = body as Record<string, unknown>;
    for (const key of ['userId', 'userWhoExecutedId']) {
      const value = values[key];
      if (value === undefined || value === null) {
        continue;
      }
      if (this.parseId(value, key) !== userId) {
        throw new ForbiddenException('Execution owner cannot be reassigned');
      }
    }
  }

  private async resolveEvidenceExecutionId(evidenceId: number): Promise<number> {
    const evidence = await this.dataSource
      .getRepository(CiltSequencesExecutionsEvidencesEntity)
      .findOne({
        select: { ciltSequencesExecutionsId: true },
        where: { id: evidenceId },
      });
    if (!evidence?.ciltSequencesExecutionsId) {
      throw new NotFoundException('Evidence not found');
    }

    return Number(evidence.ciltSequencesExecutionsId);
  }

  private parseId(value: unknown, key: string): number {
    const id = typeof value === 'number' ? value : Number(String(value).trim());
    if (!Number.isSafeInteger(id) || id <= 0) {
      throw new BadRequestException(`Invalid ${key}`);
    }
    return id;
  }
}
