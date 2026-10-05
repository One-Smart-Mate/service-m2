import { ServiceUnavailableException } from '@nestjs/common';
import { HealthService } from './health.service';
import { verifyDatabaseSchema } from '../../common/database/database-readiness';

jest.mock('../../common/database/database-readiness', () => ({
  verifyDatabaseSchema: jest.fn(),
}));
describe('HealthService', () => {
  const dataSource = { query: jest.fn() };
  const service = new HealthService(dataSource as any);
  beforeEach(() => jest.resetAllMocks());
  it('gates startup on the schema verification used by the deployment preflight', async () => {
    await service.onModuleInit();
    expect(verifyDatabaseSchema).toHaveBeenCalledWith(dataSource);
  });
  it('fails startup before serving traffic when schema requirements are missing', async () => {
    jest
      .mocked(verifyDatabaseSchema)
      .mockRejectedValueOnce(new Error('Missing migration'));
    await expect(service.onModuleInit()).rejects.toThrow('Missing migration');
  });
  it('reports readiness only with a usable UTC database connection', async () => {
    dataSource.query.mockResolvedValueOnce([{ timezone: '+00:00' }]);
    await expect(service.check()).resolves.toEqual({ status: 'ready' });
  });
  it('returns 503 when the database is unavailable', async () => {
    dataSource.query.mockRejectedValueOnce(new Error('connection unavailable'));
    await expect(service.check()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
