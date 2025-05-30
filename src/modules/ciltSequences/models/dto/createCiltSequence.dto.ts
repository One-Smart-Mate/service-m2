import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsNumber,
  IsISO8601,
  Length,
} from 'class-validator';

export class CreateCiltSequenceDTO {
  @ApiProperty({ description: 'Site ID', required: false, example: 1 })
  @IsOptional()
  @IsNumber()
  siteId?: number;

  @ApiProperty({
    description: 'Site name',
    required: false,
    example: 'Main Plant',
  })
  @IsOptional()
  @IsString()
  siteName?: string;

  @ApiPropertyOptional({
    description: 'Expected standard',
    required: false,
    example: 'All welds must have no porosity',
  })
  @IsOptional()
  @IsString()
  standardOk?: string;

  @ApiProperty({ description: 'CILT master ID', required: false, example: 54 })
  @IsOptional()
  @IsNumber()
  ciltMstrId?: number;

  @ApiProperty({
    description: 'CILT master name',
    required: false,
    example: 'Welding',
  })
  @IsOptional()
  @IsString()
  ciltMstrName?: string;

  @ApiProperty({ description: 'Frequency ID', required: false, example: 2 })
  @IsOptional()
  @IsNumber()
  frecuencyId?: number;

  @ApiProperty({
    description: 'Frequency code (3 chars)',
    required: false,
    example: 'DLY',
    maxLength: 3,
  })
  @IsOptional()
  @IsString()
  @Length(1, 3)
  frecuencyCode?: string;

  @ApiProperty({
    description: 'Reference point',
    required: false,
    example: 'PNT1',
  })
  @IsOptional()
  @IsString()
  referencePoint?: string;

  @ApiPropertyOptional({
    description:
      'Sequence order (optional: if omitted, server will auto-calculate)',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  order?: number;

  @ApiProperty({
    description: 'Sequence list',
    required: false,
    example: 'Step1,Step2',
  })
  @IsOptional()
  @IsString()
  secuenceList?: string;

  @ApiProperty({
    description: 'Sequence color (hex 6 chars)',
    required: false,
    example: 'FF0000',
    maxLength: 6,
  })
  @IsOptional()
  @IsString()
  @Length(6, 6)
  secuenceColor?: string;

  @ApiProperty({ description: 'CILT type ID', required: false, example: 3 })
  @IsOptional()
  @IsNumber()
  ciltTypeId?: number;

  @ApiProperty({
    description: 'CILT type name',
    required: false,
    example: 'TypeA',
  })
  @IsOptional()
  @IsString()
  ciltTypeName?: string;

  @ApiProperty({
    description: 'Reference OPL/SOP ID',
    required: false,
    example: 7,
  })
  @IsOptional()
  @IsNumber()
  referenceOplSopId?: number;

  @ApiProperty({
    description: 'Remediation OPL/SOP ID',
    required: false,
    example: 9,
  })
  @IsOptional()
  @IsNumber()
  remediationOplSopId?: number;

  @ApiProperty({
    description: 'Standard time in seconds',
    required: false,
    example: 90,
  })
  @IsOptional()
  @IsNumber()
  standardTime?: number;

  @ApiPropertyOptional({
    description: 'Required tools',
    required: false,
    example: 'Helmet, Gloves',
  })
  @IsOptional()
  @IsString()
  toolsRequired?: string;

  @ApiPropertyOptional({
    description: 'Is it a stoppage reason? (1=yes, 0=no)',
    required: false,
    example: 0,
  })
  @IsOptional()
  @IsNumber()
  stoppageReason?: number;

  @ApiPropertyOptional({
    description: 'Is the machine stopped? (1=yes, 0=no)',
    required: false,
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  machineStopped?: number;

  @ApiPropertyOptional({
    description: 'Number of pictures at start',
    required: false,
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  quantityPicturesCreate?: number;

  @ApiPropertyOptional({
    description: 'Number of pictures at end',
    required: false,
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  quantityPicturesClose?: number;

  @ApiPropertyOptional({
    description: 'Selectable without programming (1=yes, 0=no)',
    required: false,
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  selectableWithoutProgramming?: number;

  @ApiPropertyOptional({
    description: 'Sequence status (A=Active, I=Inactive, D=Draft)',
    required: false,
    example: 'A',
  })
  @IsOptional()
  @IsString()
  @Length(1, 1)
  status?: string;

  @ApiProperty({
    description: 'Creation date in ISO format',
    example: '2025-05-30T10:00:00.000Z',
  })
  @IsISO8601()
  createdAt: string;
}
