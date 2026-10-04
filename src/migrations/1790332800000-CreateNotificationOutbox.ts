import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateNotificationOutbox1790332800000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('notification_outbox')) {
      return;
    }

    await queryRunner.createTable(
      new Table({
        name: 'notification_outbox',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            unsigned: true,
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'deduplication_key',
            type: 'varchar',
            length: '191',
          },
          { name: 'payload', type: 'json' },
          {
            name: 'status',
            type: 'enum',
            enum: ['PENDING', 'PROCESSING', 'FAILED', 'SENT', 'DEAD'],
            default: "'PENDING'",
          },
          { name: 'attempts', type: 'int', unsigned: true, default: 0 },
          { name: 'available_at', type: 'datetime', precision: 6 },
          {
            name: 'locked_at',
            type: 'datetime',
            precision: 6,
            isNullable: true,
          },
          {
            name: 'sent_at',
            type: 'datetime',
            precision: 6,
            isNullable: true,
          },
          {
            name: 'last_error',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          { name: 'created_at', type: 'timestamp' },
          { name: 'updated_at', type: 'timestamp', isNullable: true },
        ],
      }),
    );

    await queryRunner.createIndex(
      'notification_outbox',
      new TableIndex({
        name: 'uq_notification_outbox_deduplication_key',
        columnNames: ['deduplication_key'],
        isUnique: true,
      }),
    );
    await queryRunner.createIndex(
      'notification_outbox',
      new TableIndex({
        name: 'idx_notification_outbox_ready',
        columnNames: ['status', 'available_at'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('notification_outbox')) {
      await queryRunner.dropTable('notification_outbox');
    }
  }
}
