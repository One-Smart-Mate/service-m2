import { stringConstants } from 'src/utils/string.constant';

interface CatalogLifecycleEntity {
  status: string;
  updatedAt: Date;
  deletedAt: Date | null;
}

export const applyCatalogLifecycle = <T extends CatalogLifecycleEntity>(
  entity: T,
  status: string,
  changedAt: Date = new Date(),
): T => {
  entity.status = status;
  entity.updatedAt = changedAt;
  entity.deletedAt = status === stringConstants.A ? null : changedAt;
  return entity;
};
