import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class ReserveCardEvidenceUploads1791072000002 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('card_evidence_uploads')) return;
    await queryRunner.createTable(
      new Table({
        name: 'card_evidence_uploads',
        engine: 'InnoDB',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            unsigned: true,
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'site_id', type: 'bigint', unsigned: true },
          { name: 'card_uuid', type: 'varchar', length: '60' },
          { name: 'evidence_id', type: 'varchar', length: '60' },
          { name: 'evidence_type', type: 'varchar', length: '4' },
          { name: 'object_key', type: 'varchar', length: '300' },
          { name: 'owner_id', type: 'bigint', unsigned: true },
          { name: 'content_hash', type: 'varchar', length: '64' },
          { name: 'content_type', type: 'varchar', length: '100' },
          { name: 'size', type: 'int', unsigned: true },
          {
            name: 'status',
            type: 'varchar',
            length: '10',
            default: "'PENDING'",
          },
          {
            name: 'created_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        indices: [
          {
            name: 'uq_card_upload_identity',
            columnNames: [
              'site_id',
              'card_uuid',
              'evidence_type',
              'evidence_id',
            ],
            isUnique: true,
          },
          {
            name: 'uq_card_upload_key',
            columnNames: ['object_key'],
            isUnique: true,
          },
        ],
      }),
    );
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('card_evidence_uploads', true);
  }
}
