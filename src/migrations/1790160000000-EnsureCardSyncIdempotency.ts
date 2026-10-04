import { MigrationInterface, QueryRunner, TableIndex } from 'typeorm';

export class EnsureCardSyncIdempotency1790160000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const [duplicateUuid] = await queryRunner.query(`
      SELECT card_UUID
      FROM cards
      GROUP BY card_UUID
      HAVING COUNT(*) > 1
      LIMIT 1
    `);
    if (duplicateUuid) {
      throw new Error(
        'Cannot enforce card UUID idempotency: duplicate card_UUID values exist',
      );
    }

    const [duplicateSiteFolio] = await queryRunner.query(`
      SELECT site_id, site_card_id
      FROM cards
      GROUP BY site_id, site_card_id
      HAVING COUNT(*) > 1
      LIMIT 1
    `);
    if (duplicateSiteFolio) {
      throw new Error(
        'Cannot enforce card folio uniqueness: duplicate site folios exist',
      );
    }

    const cardsTable = await queryRunner.getTable('cards');
    if (!cardsTable?.indices.some((index) => index.name === 'uq_cards_uuid')) {
      await queryRunner.createIndex(
        'cards',
        new TableIndex({
          name: 'uq_cards_uuid',
          columnNames: ['card_UUID'],
          isUnique: true,
        }),
      );
    }
    if (
      !cardsTable?.indices.some(
        (index) => index.name === 'uq_cards_site_folio',
      )
    ) {
      await queryRunner.createIndex(
        'cards',
        new TableIndex({
          name: 'uq_cards_site_folio',
          columnNames: ['site_id', 'site_card_id'],
          isUnique: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const cardsTable = await queryRunner.getTable('cards');
    if (
      cardsTable?.indices.some(
        (index) => index.name === 'uq_cards_site_folio',
      )
    ) {
      await queryRunner.dropIndex('cards', 'uq_cards_site_folio');
    }
    if (cardsTable?.indices.some((index) => index.name === 'uq_cards_uuid')) {
      await queryRunner.dropIndex('cards', 'uq_cards_uuid');
    }
  }
}
