import { BadRequestException } from '@nestjs/common';
import {
  applyResultLimit,
  extractSqlFromModelResponse,
  IA_RESULT_LIMIT,
  validateReadOnlySql,
} from './ia-query-policy';

describe('AI query policy', () => {
  it('extracts SQL from a fenced model response', () => {
    expect(
      extractSqlFromModelResponse('```sql\nSELECT id FROM cards;\n```'),
    ).toBe('SELECT id FROM cards;');
  });

  it('accepts a single SELECT over allowlisted tables', () => {
    expect(
      validateReadOnlySql(
        'SELECT c.id, s.name FROM `cards` c JOIN sites s ON s.id = c.site_id;',
      ),
    ).toBe(
      'SELECT c.id, s.name FROM `cards` c JOIN sites s ON s.id = c.site_id',
    );
  });

  it('allows SQL-looking text inside a string literal', () => {
    expect(
      validateReadOnlySql(
        "SELECT id FROM cards WHERE description = 'drop; -- maintenance note'",
      ),
    ).toBe(
      "SELECT id FROM cards WHERE description = 'drop; -- maintenance note'",
    );
  });

  it.each([
    "UPDATE cards SET description = 'changed'",
    'DELETE FROM cards',
    'SELECT id FROM cards; DROP TABLE cards',
    'SELECT id FROM cards UNION SELECT id FROM users',
    'SELECT SLEEP(10) FROM cards',
    "SELECT LOAD_FILE('/etc/passwd') FROM cards",
    "SELECT id FROM cards INTO OUTFILE '/tmp/cards.csv'",
    'SELECT @secret FROM cards',
    'SELECT id FROM cards -- bypass',
    'SELECT c.id FROM cards c, users u WHERE u.id = c.creator_id',
    'SELECT c.id FROM cards c STRAIGHT_JOIN users u ON u.id = c.creator_id',
  ])('rejects unsafe SQL: %s', (sql) => {
    expect(() => validateReadOnlySql(sql)).toThrow(BadRequestException);
  });

  it.each([
    'SELECT id FROM users',
    'SELECT id FROM password_resets_OLD',
    'SELECT id FROM information_schema.tables',
    'SELECT id FROM cards c JOIN users u ON u.id = c.creator_id',
  ])('rejects sensitive or database-qualified tables: %s', (sql) => {
    expect(() => validateReadOnlySql(sql)).toThrow(BadRequestException);
  });

  it('rejects queries without a valid allowlisted table reference', () => {
    expect(() => validateReadOnlySql('SELECT 1')).toThrow(BadRequestException);
    expect(() =>
      validateReadOnlySql('SELECT * FROM (SELECT id FROM cards) c'),
    ).toThrow(BadRequestException);
  });

  it('caps every validated result set', () => {
    expect(applyResultLimit('SELECT id FROM cards')).toBe(
      `SELECT * FROM (SELECT id FROM cards) AS ai_result LIMIT ${IA_RESULT_LIMIT}`,
    );
  });
});
