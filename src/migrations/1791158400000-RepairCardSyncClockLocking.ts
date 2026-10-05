import { MigrationInterface, QueryRunner } from 'typeorm';
import { CommitOrderedCardSync1791072000004 } from './1791072000004-CommitOrderedCardSync';

/** Stop application writers while replacing triggers; MySQL DDL is not atomic. */
export class RepairCardSyncClockLocking1791158400000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    // Preserve revisions and journal data while replacing the old shared-lock
    // upgrade with a single exclusive upsert, including on already migrated DBs.
    await new CommitOrderedCardSync1791072000004().up(queryRunner);
  }

  async down(): Promise<void> {
    // Keep the corrected triggers. Reverting the marker must not reintroduce
    // the deadlock or erase mobile sync history.
  }
}
