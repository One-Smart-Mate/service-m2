import { MigrationInterface, QueryRunner } from 'typeorm';

/** Apply with application writers stopped: MySQL DDL is not transactional. */
export class CommitOrderedCardSync1791072000004 implements MigrationInterface {
  async up(q: QueryRunner): Promise<void> {
    await q.query(`CREATE TABLE IF NOT EXISTS card_sync_clock (
      site_id BIGINT UNSIGNED NOT NULL PRIMARY KEY,
      revision BIGINT UNSIGNED NOT NULL DEFAULT 0
    ) ENGINE=InnoDB`);
    await q.query(`CREATE TABLE IF NOT EXISTS card_sync_changes (
      card_id BIGINT UNSIGNED NOT NULL PRIMARY KEY,
      site_id BIGINT UNSIGNED NOT NULL,
      revision BIGINT UNSIGNED NOT NULL,
      card_uuid VARCHAR(255) NOT NULL,
      changed_at DATETIME(6) NOT NULL,
      deleted_at DATETIME(6) NULL,
      INDEX idx_card_sync_revision (site_id, revision, card_id)
    ) ENGINE=InnoDB`);
    await q.query(
      'INSERT IGNORE INTO card_sync_clock (site_id) SELECT id FROM sites',
    );
    await q.query(`INSERT IGNORE INTO card_sync_changes
      (card_id, site_id, revision, card_uuid, changed_at, deleted_at)
      SELECT id, site_id, 0, card_UUID, sync_changed_at, deleted_at FROM cards`);
    for (const table of ['cards', 'evidences']) {
      for (const event of ['INSERT', 'UPDATE', 'DELETE']) {
        const row = event === 'DELETE' ? 'OLD' : 'NEW';
        const cardId = table === 'cards' ? `${row}.id` : `${row}.card_id`;
        const identity =
          table === 'cards'
            ? `SELECT ${row}.id, ${row}.site_id, v_revision, ${row}.card_UUID, UTC_TIMESTAMP(6), ${event === 'DELETE' ? 'UTC_TIMESTAMP(6)' : `${row}.deleted_at`}`
            : `SELECT c.id, c.site_id, v_revision, c.card_UUID, UTC_TIMESTAMP(6), c.deleted_at FROM cards c WHERE c.id = ${cardId} AND c.site_id = ${row}.site_id`;
        // The revision row remains locked until COMMIT. A larger committed
        // revision can never overtake an uncommitted earlier revision.
        await q.query(
          `DROP TRIGGER IF EXISTS card_sync_${table}_${event.toLowerCase()}`,
        );
        await q.query(`CREATE TRIGGER card_sync_${table}_${event.toLowerCase()}
          AFTER ${event} ON ${table} FOR EACH ROW
          BEGIN
            DECLARE v_revision BIGINT UNSIGNED;
            ${event === 'UPDATE' ? `IF OLD.site_id <> NEW.site_id ${table === 'evidences' ? 'OR OLD.card_id <> NEW.card_id' : ''} THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Sync resource ownership is immutable'; END IF;` : ''}
            ${table === 'evidences' && event !== 'DELETE' ? `IF NOT EXISTS (SELECT 1 FROM cards WHERE id = NEW.card_id AND site_id = NEW.site_id) THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Evidence must belong to its card site'; END IF;` : ''}
            INSERT INTO card_sync_clock (site_id, revision) VALUES (${row}.site_id, 1)
              ON DUPLICATE KEY UPDATE revision = revision + 1;
            SELECT revision INTO v_revision FROM card_sync_clock WHERE site_id = ${row}.site_id;
            INSERT INTO card_sync_changes (card_id, site_id, revision, card_uuid, changed_at, deleted_at)
            ${identity}
            ON DUPLICATE KEY UPDATE revision = v_revision, changed_at = UTC_TIMESTAMP(6), deleted_at = VALUES(deleted_at);
          END`);
      }
    }
  }

  async down(q: QueryRunner): Promise<void> {
    for (const table of ['cards', 'evidences'])
      for (const event of ['insert', 'update', 'delete'])
        await q.query(`DROP TRIGGER IF EXISTS card_sync_${table}_${event}`);
    await q.query('DROP TABLE card_sync_changes');
    await q.query('DROP TABLE card_sync_clock');
  }
}
