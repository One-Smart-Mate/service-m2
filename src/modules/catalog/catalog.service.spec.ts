import {
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UsersService } from '../users/users.service';
import { CatalogService } from './catalog.service';
import { CatalogSnapshotReader } from './catalog-snapshot.reader';

describe('CatalogService', () => {
  const dataSource = {
    query: jest.fn(),
  } as unknown as DataSource;
  const usersService = {
    getAccessibleSiteIds: jest.fn(),
  } as unknown as UsersService;
  const snapshotReader = {
    read: jest.fn(),
  } as unknown as CatalogSnapshotReader;
  const service = new CatalogService(dataSource, usersService, snapshotReader);

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(dataSource.query).mockResolvedValue([]);
  });

  it('allows IH_sis_admin to synchronize any site without an assignment', async () => {
    jest.mocked(usersService.getAccessibleSiteIds).mockResolvedValue(null);

    await expect(service.getCatalogs(25, 7)).resolves.toEqual({
      cardTypes: [],
      priorities: [],
      preclassifiers: [],
      levels: [],
      employees: [],
      cards: [],
    });
    expect(usersService.getAccessibleSiteIds).toHaveBeenCalledWith(7);
    expect(dataSource.query).toHaveBeenCalledTimes(7);
  });

  it('rejects synchronization for a site outside the active assignments', async () => {
    jest.mocked(usersService.getAccessibleSiteIds).mockResolvedValue([2, 3]);

    await expect(service.getCatalogs(25, 7)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(dataSource.query).not.toHaveBeenCalled();
  });

  it('rejects an invalid site before querying access or catalog data', async () => {
    await expect(service.getCatalogs(0, 7)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(usersService.getAccessibleSiteIds).not.toHaveBeenCalled();
    expect(dataSource.query).not.toHaveBeenCalled();
  });

  it('uses the same centralized access rule for paginated sync', async () => {
    jest.mocked(usersService.getAccessibleSiteIds).mockResolvedValue([25]);

    const response = await service.getCatalogsPaginated(25, 7, 1, 200);

    expect(response.cardTypes).toEqual(
      expect.objectContaining({ data: [], total: 0, page: 1, limit: 200 }),
    );
    expect(usersService.getAccessibleSiteIds).toHaveBeenCalledWith(7);
    expect(dataSource.query).toHaveBeenCalledTimes(12);
  });

  it('rejects unsafe pagination before querying access or data', async () => {
    await expect(
      service.getCatalogsPaginated(25, 7, 0, 10_000),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(usersService.getAccessibleSiteIds).not.toHaveBeenCalled();
    expect(dataSource.query).not.toHaveBeenCalled();
  });

  it('scopes paginated evidences to the requested site', async () => {
    jest.mocked(usersService.getAccessibleSiteIds).mockResolvedValue([25]);
    jest.mocked(dataSource.query).mockImplementation(async (sql) => {
      const query = String(sql);
      if (query.includes('FROM cards c')) {
        return [{ id: 90, nodeName: 'Machine' }];
      }
      if (query.includes('COUNT(*) as total FROM cards')) {
        return [{ total: '1' }];
      }
      if (query.includes('COUNT(')) {
        return [{ total: '0' }];
      }
      return [];
    });

    await service.getCatalogsPaginated(25, 7, 1, 20);

    expect(dataSource.query).toHaveBeenCalledWith(
      expect.stringContaining('AND e.site_id = ?'),
      [[90], 25],
    );
  });

  it('authorizes the offline snapshot before reading it', async () => {
    jest.mocked(usersService.getAccessibleSiteIds).mockResolvedValue([25]);
    jest.mocked(snapshotReader.read).mockResolvedValue({
      schemaVersion: 1,
      siteId: 25,
      generatedAt: '2026-09-23T12:00:00.000Z',
      revision: null,
      cardTypes: [],
      priorities: [],
      preclassifiers: [],
      levels: [],
    });

    await service.getOfflineSnapshot(25, 7);

    expect(usersService.getAccessibleSiteIds).toHaveBeenCalledWith(7);
    expect(snapshotReader.read).toHaveBeenCalledWith(25);
  });

  it('does not read an offline snapshot from an unauthorized site', async () => {
    jest.mocked(usersService.getAccessibleSiteIds).mockResolvedValue([2]);

    await expect(service.getOfflineSnapshot(25, 7)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(snapshotReader.read).not.toHaveBeenCalled();
  });

  it('returns only active employee assignments in catalog queries', async () => {
    jest.mocked(usersService.getAccessibleSiteIds).mockResolvedValue([25]);

    await service.getCatalogs(25, 7);

    const employeeQuery = jest
      .mocked(dataSource.query)
      .mock.calls.map(([sql]) => String(sql))
      .find((sql) => sql.includes('INNER JOIN user_has_sites'));
    expect(employeeQuery).toContain("uhs.status = 'A'");
    expect(employeeQuery).toContain('uhs.deleted_at IS NULL');
  });
});
