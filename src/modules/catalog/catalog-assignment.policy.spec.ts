import { UnauthorizedException } from '@nestjs/common';
import { ValidationException } from 'src/common/exceptions/types/validation.exception';
import {
  assertActiveCatalogSite,
  resolveCatalogAssignee,
} from './catalog-assignment.policy';

describe('catalog assignment policy', () => {
  const users = {
    findOneById: jest.fn(),
    getAccessibleSiteIds: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    users.findOneById.mockResolvedValue({
      id: 7,
      name: 'Responsible',
      status: 'A',
    });
  });

  it('rejects an assignee from another site', async () => {
    users.getAccessibleSiteIds.mockResolvedValue([3]);

    await expect(
      resolveCatalogAssignee(users, 7, 2),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('allows IH_sis_admin as a globally accessible assignee', async () => {
    users.getAccessibleSiteIds.mockResolvedValue(null);

    await expect(resolveCatalogAssignee(users, 7, 2)).resolves.toEqual(
      expect.objectContaining({ id: 7 }),
    );
  });

  it('rejects an inactive assignee before checking site access', async () => {
    users.findOneById.mockResolvedValue({
      id: 7,
      name: 'Inactive',
      status: 'I',
    });

    await expect(
      resolveCatalogAssignee(users, 7, 2),
    ).rejects.toBeInstanceOf(ValidationException);
    expect(users.getAccessibleSiteIds).not.toHaveBeenCalled();
  });

  it('rejects inactive or deleted sites', () => {
    expect(() =>
      assertActiveCatalogSite({ id: 2, status: 'I', deletedAt: null }),
    ).toThrow();
    expect(() =>
      assertActiveCatalogSite({ id: 2, status: 'A', deletedAt: new Date() }),
    ).toThrow();
  });
});
