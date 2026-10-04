import { BadRequestException } from '@nestjs/common';

export const IA_RESULT_LIMIT = 200;
const MAX_GENERATED_SQL_LENGTH = 20_000;

export const IA_QUERYABLE_TABLES = [
  'am_discard_reasons',
  'card_types',
  'card_types_catalog',
  'card_types_notes',
  'cards',
  'cards_notes',
  'cards_status',
  'cilt_frecuencies',
  'cilt_mstr',
  'cilt_mstr_position_levels',
  'cilt_sequences',
  'cilt_sequences_evidences',
  'cilt_sequences_executions',
  'cilt_sequences_schedule',
  'cilt_types',
  'companies',
  'companies_notes',
  'currencies',
  'evidences',
  'levels',
  'levels_notes',
  'machine_downtime_reasons',
  'opl_details',
  'opl_mstr',
  'opl_mstr_levels',
  'positions',
  'preclassifiers',
  'preclassifiers_notes',
  'priorities',
  'priorities_notes',
  'sites',
  'sites_notes',
  'status',
] as const;

const FORBIDDEN_SQL =
  /\b(insert|update|delete|drop|alter|truncate|create|replace|grant|revoke|call|execute|prepare|deallocate|set|use|show|describe|explain|analyze|optimize|repair|load|handler|lock|unlock|union|straight_join)\b|\binto\s+(outfile|dumpfile)\b|\bfor\s+update\b|\block\s+in\s+share\s+mode\b|\b(sleep|benchmark|load_file)\s*\(/i;

const stripStringLiterals = (sql: string): string => {
  let result = '';
  let quote: "'" | '"' | null = null;

  for (let index = 0; index < sql.length; index += 1) {
    const character = sql[index];

    if (quote) {
      if (character === '\\') {
        result += '  ';
        index += 1;
        continue;
      }

      if (character === quote) {
        quote = null;
      }

      result += ' ';
      continue;
    }

    if (character === "'" || character === '"') {
      quote = character;
      result += ' ';
      continue;
    }

    result += character;
  }

  if (quote) {
    throw new BadRequestException(
      'The generated SQL contains an invalid string literal',
    );
  }

  return result;
};

const hasCommaSeparatedFromSource = (sqlWithoutStrings: string): boolean => {
  const fromMatch = /\bfrom\b/i.exec(sqlWithoutStrings);
  if (!fromMatch) {
    return false;
  }

  let parenthesisDepth = 0;
  const fromClause = sqlWithoutStrings.slice(
    fromMatch.index + fromMatch[0].length,
  );

  for (let index = 0; index < fromClause.length; index += 1) {
    const remainingClause = fromClause.slice(index);
    if (
      parenthesisDepth === 0 &&
      /^(where|group\s+by|having|order\s+by|limit)\b/i.test(remainingClause)
    ) {
      return false;
    }

    if (fromClause[index] === '(') {
      parenthesisDepth += 1;
    } else if (fromClause[index] === ')') {
      parenthesisDepth -= 1;
    } else if (fromClause[index] === ',' && parenthesisDepth === 0) {
      return true;
    }
  }

  return false;
};

export const extractSqlFromModelResponse = (response: string): string => {
  const fencedQuery = response.match(/```(?:sql)?\s*([\s\S]*?)```/i);
  return (fencedQuery?.[1] ?? response).trim();
};

export const validateReadOnlySql = (
  generatedSql: string,
  allowedTables: readonly string[] = IA_QUERYABLE_TABLES,
): string => {
  const trimmedSql = generatedSql.trim();
  const sql = trimmedSql.endsWith(';')
    ? trimmedSql.slice(0, -1).trim()
    : trimmedSql;

  if (!sql) {
    throw new BadRequestException('The AI did not generate a SQL query');
  }

  if (sql.length > MAX_GENERATED_SQL_LENGTH) {
    throw new BadRequestException('The generated SQL is too long');
  }

  const sqlWithoutStrings = stripStringLiterals(sql);

  if (sqlWithoutStrings.includes(';')) {
    throw new BadRequestException('Only one SQL statement is allowed');
  }

  if (/--|#|\/\*|\*\//.test(sqlWithoutStrings)) {
    throw new BadRequestException('SQL comments are not allowed');
  }

  if (!/^select\b/i.test(sqlWithoutStrings.trim())) {
    throw new BadRequestException('Only SELECT statements are allowed');
  }

  if (FORBIDDEN_SQL.test(sqlWithoutStrings) || /@/.test(sqlWithoutStrings)) {
    throw new BadRequestException(
      'The generated SQL contains a forbidden operation',
    );
  }

  if (/\b(?:from|join)\s*\(/i.test(sqlWithoutStrings)) {
    throw new BadRequestException('Subqueries are not allowed');
  }

  if (hasCommaSeparatedFromSource(sqlWithoutStrings)) {
    throw new BadRequestException(
      'Comma-separated table sources are not allowed',
    );
  }

  const tableReferencePattern =
    /\b(?:from|join)\s+(`?[a-zA-Z0-9_$]+`?(?:\s*\.\s*`?[a-zA-Z0-9_$]+`?)?)/gi;
  const tableReferences = [
    ...sqlWithoutStrings.matchAll(tableReferencePattern),
  ];
  const tableKeywordCount = (
    sqlWithoutStrings.match(/\b(?:from|join)\b/gi) ?? []
  ).length;

  if (
    tableReferences.length === 0 ||
    tableReferences.length !== tableKeywordCount
  ) {
    throw new BadRequestException(
      'The generated SQL contains an invalid table reference',
    );
  }

  const allowedTableSet = new Set(
    allowedTables.map((table) => table.toLowerCase()),
  );

  for (const reference of tableReferences) {
    const rawTableName = reference[1].replace(/\s/g, '');

    if (rawTableName.includes('.')) {
      throw new BadRequestException(
        'Database-qualified table names are not allowed',
      );
    }

    const tableName = rawTableName.replace(/`/g, '').toLowerCase();
    if (!allowedTableSet.has(tableName)) {
      throw new BadRequestException(
        `Table ${tableName} is not available for AI queries`,
      );
    }
  }

  return sql;
};

export const applyResultLimit = (validatedSql: string): string =>
  `SELECT * FROM (${validatedSql}) AS ai_result LIMIT ${IA_RESULT_LIMIT}`;
