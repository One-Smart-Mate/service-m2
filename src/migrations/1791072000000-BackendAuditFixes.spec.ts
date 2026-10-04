import { CreateOplUserAccess1791072000000 } from './1791072000000-CreateOplUserAccess';
import { HardenCiltExecutionIdentity1791072000001 } from './1791072000001-HardenCiltExecutionIdentity';
import { ReserveCardEvidenceUploads1791072000002 } from './1791072000002-ReserveCardEvidenceUploads';

describe('backend audit migrations', () => {
  it('creates the OPL counter table with a unique user/OPL pair', async () => {
    const runner = {
      hasTable: jest.fn().mockResolvedValue(false),
      createTable: jest.fn(),
      query: jest.fn().mockResolvedValue([]),
      getTable: jest.fn().mockResolvedValue({ indices: [], uniques: [] }),
      createIndex: jest.fn(),
    };
    await new CreateOplUserAccess1791072000000().up(runner as never);
    expect(runner.createTable).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'opl_user_access', engine: 'InnoDB' }),
    );
    expect(runner.createIndex).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        name: 'uq_opl_user',
        isUnique: true,
        columnNames: ['user_id', 'opl_id'],
      }),
    );
  });
  it('adds unique CILT folio and the complete schedule identity', async () => {
    const runner = {
      query: jest.fn().mockResolvedValue([]),
      getTable: jest.fn().mockResolvedValue({ indices: [] }),
      createIndex: jest.fn(),
    };
    await new HardenCiltExecutionIdentity1791072000001().up(runner as never);
    expect(runner.createIndex).toHaveBeenCalledTimes(2);
    expect(runner.createIndex).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        name: 'uq_cilt_execution_schedule',
        isUnique: true,
        columnNames: [
          'site_id',
          'cilt_id',
          'cilt_secuence_id',
          'user_id',
          'level_id',
          'position_id',
          'secuence_schedule',
        ],
      }),
    );
  });
  it('refuses historical duplicates before changing schema or deleting data', async () => {
    const runner = {
      query: jest.fn().mockResolvedValue([{ id: 1 }]),
      createIndex: jest.fn(),
    };
    await expect(
      new HardenCiltExecutionIdentity1791072000001().up(runner as never),
    ).rejects.toThrow('reconcile duplicate executions');
    expect(runner.createIndex).not.toHaveBeenCalled();
    expect(runner.query).toHaveBeenCalledTimes(1);
  });
  it('creates immutable upload receipts with unique keys and logical identities', async () => {
    const runner = {
      hasTable: jest.fn().mockResolvedValue(false),
      createTable: jest.fn(),
    };
    await new ReserveCardEvidenceUploads1791072000002().up(runner as never);
    expect(runner.createTable).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'card_evidence_uploads',
        indices: expect.arrayContaining([
          expect.objectContaining({
            name: 'uq_card_upload_identity',
            isUnique: true,
          }),
          expect.objectContaining({
            name: 'uq_card_upload_key',
            isUnique: true,
          }),
        ]),
      }),
    );
  });
});
