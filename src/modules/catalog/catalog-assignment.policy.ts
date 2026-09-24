import { UnauthorizedException } from '@nestjs/common';
import {
  NotFoundCustomException,
  NotFoundCustomExceptionType,
} from 'src/common/exceptions/types/notFound.exception';
import {
  ValidationException,
  ValidationExceptionType,
} from 'src/common/exceptions/types/validation.exception';
import { stringConstants } from 'src/utils/string.constant';

interface CatalogAssignee {
  id: number;
  name: string;
  email?: string;
  status: string;
}

interface CatalogUsersPort {
  findOneById(userId: number): Promise<CatalogAssignee | undefined>;
  getAccessibleSiteIds(userId: number): Promise<number[] | null>;
}

interface CatalogSite {
  id: number;
  status: string;
  deletedAt?: Date | null;
}

export const assertActiveCatalogSite = <T extends CatalogSite>(site: T): T => {
  if (
    site.status !== stringConstants.activeStatus ||
    site.deletedAt != null
  ) {
    throw new NotFoundCustomException(NotFoundCustomExceptionType.SITE);
  }
  return site;
};

export const resolveCatalogAssignee = async (
  users: CatalogUsersPort,
  userId: number,
  siteId: number,
): Promise<CatalogAssignee> => {
  const assignee = await users.findOneById(userId);
  if (!assignee) {
    throw new NotFoundCustomException(NotFoundCustomExceptionType.USER);
  }
  if (assignee.status !== stringConstants.activeStatus) {
    throw new ValidationException(ValidationExceptionType.USER_INACTIVE);
  }

  const accessibleSiteIds = await users.getAccessibleSiteIds(userId);
  if (
    accessibleSiteIds !== null &&
    !accessibleSiteIds.includes(Number(siteId))
  ) {
    throw new UnauthorizedException('Assignee does not have site access');
  }

  return assignee;
};
