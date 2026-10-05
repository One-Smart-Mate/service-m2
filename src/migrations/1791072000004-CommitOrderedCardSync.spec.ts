import { CommitOrderedCardSync1791072000004 } from './1791072000004-CommitOrderedCardSync';

describe('Commit ordered card sync migration SQL generation', () => {
  it('covers every card/evidence write and holds a transactional revision lock', async () => {
    const query = jest.fn().mockResolvedValue([]);
    await new CommitOrderedCardSync1791072000004().up({ query } as any);
    const triggers = query.mock.calls
      .map(([sql]) => String(sql))
      .filter((sql) => sql.startsWith('CREATE TRIGGER'));
    expect(triggers).toHaveLength(6);
    for (const sql of triggers) {
      expect(sql).toContain(
        'UPDATE card_sync_clock SET revision = revision + 1',
      );
      expect(sql).toContain('ON DUPLICATE KEY UPDATE revision = v_revision');
    }
    expect(
      triggers.find((sql) => sql.includes('AFTER DELETE ON cards')),
    ).toContain('OLD.card_UUID, UTC_TIMESTAMP(6), UTC_TIMESTAMP(6)');
    expect(
      triggers.find((sql) => sql.includes('AFTER UPDATE ON cards')),
    ).toContain('Sync resource ownership is immutable');
  });
});
