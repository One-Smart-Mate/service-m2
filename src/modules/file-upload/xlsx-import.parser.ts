import { BadRequestException } from '@nestjs/common';
import { CellValue, Workbook } from 'exceljs';

export type ImportedUserRow = {
  Name?: string;
  Email?: string;
  Role?: string;
  PhoneNumber?: string;
  Celular?: string;
  Translation?: string;
};

const MAX_ARCHIVE_ENTRIES = 1_000;
const MAX_UNCOMPRESSED_BYTES = 25 * 1024 * 1024;
const MAX_ENTRY_BYTES = 15 * 1024 * 1024;
const MAX_COMPRESSION_RATIO = 100;
const MAX_ROWS = 5_000;
const MAX_COLUMNS = 20;
const END_OF_CENTRAL_DIRECTORY = 0x06054b50;
const CENTRAL_DIRECTORY_ENTRY = 0x02014b50;
const ZIP64_SENTINEL_16 = 0xffff;
const ZIP64_SENTINEL_32 = 0xffffffff;

const allowedHeaders = new Set<keyof ImportedUserRow>([
  'Name',
  'Email',
  'Role',
  'PhoneNumber',
  'Celular',
  'Translation',
]);

const invalidWorkbook = (detail: string): BadRequestException =>
  new BadRequestException(`Invalid XLSX file: ${detail}`);

const findEndOfCentralDirectory = (buffer: Buffer): number => {
  const minimumOffset = Math.max(0, buffer.length - (65_535 + 22));
  for (let offset = buffer.length - 22; offset >= minimumOffset; offset--) {
    if (buffer.readUInt32LE(offset) === END_OF_CENTRAL_DIRECTORY) {
      return offset;
    }
  }
  throw invalidWorkbook('ZIP directory not found');
};

export const validateXlsxArchive = (buffer: Buffer): void => {
  if (!Buffer.isBuffer(buffer) || buffer.length < 22) {
    throw invalidWorkbook('empty or truncated file');
  }

  const endOffset = findEndOfCentralDirectory(buffer);
  const entryCount = buffer.readUInt16LE(endOffset + 10);
  const centralDirectorySize = buffer.readUInt32LE(endOffset + 12);
  const centralDirectoryOffset = buffer.readUInt32LE(endOffset + 16);

  if (
    entryCount === ZIP64_SENTINEL_16 ||
    centralDirectorySize === ZIP64_SENTINEL_32 ||
    centralDirectoryOffset === ZIP64_SENTINEL_32
  ) {
    throw invalidWorkbook('ZIP64 archives are not supported');
  }
  if (entryCount === 0 || entryCount > MAX_ARCHIVE_ENTRIES) {
    throw invalidWorkbook('archive entry limit exceeded');
  }
  if (
    centralDirectoryOffset + centralDirectorySize > endOffset ||
    centralDirectoryOffset < 0
  ) {
    throw invalidWorkbook('corrupt ZIP directory');
  }

  let offset = centralDirectoryOffset;
  let totalUncompressedBytes = 0;
  const names = new Set<string>();

  for (let index = 0; index < entryCount; index++) {
    if (
      offset + 46 > buffer.length ||
      buffer.readUInt32LE(offset) !== CENTRAL_DIRECTORY_ENTRY
    ) {
      throw invalidWorkbook('corrupt ZIP entry');
    }

    const flags = buffer.readUInt16LE(offset + 8);
    const compressionMethod = buffer.readUInt16LE(offset + 10);
    const compressedBytes = buffer.readUInt32LE(offset + 20);
    const uncompressedBytes = buffer.readUInt32LE(offset + 24);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const nextOffset = offset + 46 + nameLength + extraLength + commentLength;

    if (nextOffset > buffer.length) {
      throw invalidWorkbook('truncated ZIP entry');
    }
    if ((flags & 0x1) !== 0) {
      throw invalidWorkbook('encrypted workbooks are not supported');
    }
    if (![0, 8].includes(compressionMethod)) {
      throw invalidWorkbook('unsupported ZIP compression');
    }
    if (
      compressedBytes === ZIP64_SENTINEL_32 ||
      uncompressedBytes === ZIP64_SENTINEL_32
    ) {
      throw invalidWorkbook('ZIP64 entries are not supported');
    }

    const rawName = buffer
      .subarray(offset + 46, offset + 46 + nameLength)
      .toString('utf8');
    const normalizedName = rawName.replace(/\\/g, '/');
    if (
      normalizedName.startsWith('/') ||
      normalizedName.split('/').includes('..') ||
      normalizedName.includes('\0')
    ) {
      throw invalidWorkbook('unsafe ZIP entry path');
    }

    totalUncompressedBytes += uncompressedBytes;
    const compressionRatio = uncompressedBytes / Math.max(compressedBytes, 1);
    if (
      uncompressedBytes > MAX_ENTRY_BYTES ||
      totalUncompressedBytes > MAX_UNCOMPRESSED_BYTES ||
      (uncompressedBytes > 1024 * 1024 &&
        compressionRatio > MAX_COMPRESSION_RATIO)
    ) {
      throw invalidWorkbook('decompressed size limit exceeded');
    }

    if (names.has(normalizedName)) {
      throw invalidWorkbook('duplicate ZIP entry');
    }
    names.add(normalizedName);
    offset = nextOffset;
  }

  if (offset !== centralDirectoryOffset + centralDirectorySize) {
    throw invalidWorkbook('ZIP directory size mismatch');
  }
  if (!names.has('[Content_Types].xml') || !names.has('xl/workbook.xml')) {
    throw invalidWorkbook('required workbook entries are missing');
  }
};

const scalarCellValue = (value: CellValue): string | undefined => {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value).trim();
  }
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object') {
    if ('result' in value) {
      return scalarCellValue(value.result as CellValue);
    }
    if ('richText' in value && Array.isArray(value.richText)) {
      return value.richText.map((part) => part.text).join('').trim();
    }
    if ('text' in value && typeof value.text === 'string') {
      return value.text.trim();
    }
  }
  throw invalidWorkbook('unsupported cell value');
};

export const parseUserImportWorkbook = async (
  buffer: Buffer,
): Promise<ImportedUserRow[]> => {
  validateXlsxArchive(buffer);

  const workbook = new Workbook();
  try {
    await workbook.xlsx.load(
      buffer as unknown as Parameters<typeof workbook.xlsx.load>[0],
    );
  } catch {
    throw invalidWorkbook('workbook could not be parsed');
  }

  const worksheet = workbook.worksheets[0];
  if (!worksheet) throw invalidWorkbook('worksheet is missing');
  if (worksheet.rowCount > MAX_ROWS || worksheet.columnCount > MAX_COLUMNS) {
    throw invalidWorkbook('worksheet dimensions exceed the allowed limits');
  }

  const headerRow = worksheet.getRow(1);
  const headers = new Map<number, keyof ImportedUserRow>();
  const seenHeaders = new Set<string>();
  for (let column = 1; column <= headerRow.cellCount; column++) {
    const header = scalarCellValue(headerRow.getCell(column).value);
    if (!header) continue;
    if (!allowedHeaders.has(header as keyof ImportedUserRow)) {
      throw invalidWorkbook(`unsupported column: ${header}`);
    }
    if (seenHeaders.has(header)) {
      throw invalidWorkbook(`duplicate column: ${header}`);
    }
    seenHeaders.add(header);
    headers.set(column, header as keyof ImportedUserRow);
  }

  for (const requiredHeader of ['Name', 'Email', 'Role']) {
    if (!seenHeaders.has(requiredHeader)) {
      throw invalidWorkbook(`required column is missing: ${requiredHeader}`);
    }
  }

  const rows: ImportedUserRow[] = [];
  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
    const row = worksheet.getRow(rowNumber);
    const record: ImportedUserRow = Object.create(null);
    let hasValue = false;
    for (const [column, header] of headers) {
      const value = scalarCellValue(row.getCell(column).value);
      if (value !== undefined && value !== '') {
        record[header] = value;
        hasValue = true;
      }
    }
    if (hasValue) rows.push(record);
  }

  return rows;
};
