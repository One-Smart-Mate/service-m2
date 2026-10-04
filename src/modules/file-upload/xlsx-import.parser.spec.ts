import { BadRequestException } from '@nestjs/common';
import { Workbook } from 'exceljs';
import {
  parseUserImportWorkbook,
  validateXlsxArchive,
} from './xlsx-import.parser';

describe('XLSX user import parser', () => {
  const createWorkbook = async (): Promise<Buffer> => {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Users');
    worksheet.addRow([
      'Name',
      'Email',
      'Role',
      'PhoneNumber',
      'Translation',
    ]);
    worksheet.addRow([
      'Test User',
      'user@example.com',
      'operator',
      '521234567890',
      'ES',
    ]);
    const result = await workbook.xlsx.writeBuffer();
    return Buffer.from(result);
  };

  it('reads only the allowlisted user columns', async () => {
    const rows = await parseUserImportWorkbook(await createWorkbook());

    expect(rows).toEqual([
      {
        Name: 'Test User',
        Email: 'user@example.com',
        Role: 'operator',
        PhoneNumber: '521234567890',
        Translation: 'ES',
      },
    ]);
    expect(Object.getPrototypeOf(rows[0])).toBeNull();
  });

  it('rejects malformed files before ExcelJS parses them', () => {
    expect(() => validateXlsxArchive(Buffer.from('not an xlsx'))).toThrow(
      BadRequestException,
    );
  });

  it('rejects a decompression bomb declared in the ZIP directory', async () => {
    const buffer = await createWorkbook();
    const centralEntry = buffer.indexOf(Buffer.from([0x50, 0x4b, 0x01, 0x02]));
    expect(centralEntry).toBeGreaterThanOrEqual(0);
    buffer.writeUInt32LE(16 * 1024 * 1024, centralEntry + 24);

    expect(() => validateXlsxArchive(buffer)).toThrow(BadRequestException);
  });
});
