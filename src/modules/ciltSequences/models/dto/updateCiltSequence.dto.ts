import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsISO8601,
} from 'class-validator';

export class UpdateCiltSequenceDTO {
  @ApiProperty({ description: 'Sequence ID', example: 83 })
  @IsNotEmpty()
  @IsNumber()
  id: number;

  @ApiPropertyOptional({ description: 'Site ID', example: 1 })
  @IsOptional()
  @IsNumber()
  siteId?: number;

  @ApiPropertyOptional({ description: 'Site name', example: 'Main Plant' })
  @IsOptional()
  @IsString()
  siteName?: string;

  @ApiPropertyOptional({ description: 'Area ID', example: 5 })
  @IsOptional()
  @IsNumber()
  areaId?: number;

  @ApiPropertyOptional({ description: 'Area name', example: 'Welding Area' })
  @IsOptional()
  @IsString()
  areaName?: string;

  @ApiPropertyOptional({ description: 'Position ID', example: 7 })
  @IsOptional()
  @IsNumber()
  positionId?: number;

  @ApiPropertyOptional({ description: 'Position name', example: 'Operator' })
  @IsOptional()
  @IsString()
  positionName?: string;

  @ApiPropertyOptional({ description: 'CILT master ID', example: 54 })
  @IsOptional()
  @IsNumber()
  ciltMstrId?: number;

  @ApiPropertyOptional({ description: 'CILT master name', example: 'Welding' })
  @IsOptional()
  @IsString()
  ciltMstrName?: string;

  @ApiPropertyOptional({ description: 'Frequency ID', example: 2 })
  @IsOptional()
  @IsNumber()
  frecuencyId?: number;

  @ApiPropertyOptional({ description: 'Frequency code', example: 'DLY' })
  @IsOptional()
  @IsString()
  frecuencyCode?: string;

  @ApiPropertyOptional({ description: 'Level ID', example: 3 })
  @IsOptional()
  @IsNumber()
  levelId?: number;

  @ApiPropertyOptional({ description: 'Level name', example: 'Level 1' })
  @IsOptional()
  @IsString()
  levelName?: string;

  @ApiPropertyOptional({ description: 'Route of the level', example: '/route/1' })
  @IsOptional()
  @IsString()
  route?: string;

  @ApiPropertyOptional({ description: 'Reference point', example: 'PNT1' })
  @IsOptional()
  @IsString()
  referencePoint?: string;

  @ApiPropertyOptional({
    description: 'Sequence order',
    example: 2,
  })
  @IsOptional()
  @IsNumber()
  order?: number;

  @ApiPropertyOptional({ description: 'Sequence list', example: 'Step1,Step2' })
  @IsOptional()
  @IsString()
  secuenceList?: string;

  @ApiPropertyOptional({
    description: 'Sequence color in hexadecimal',
    example: 'FF0000',
  })
  @IsOptional()
  @IsString()
  secuenceColor?: string;

  @ApiPropertyOptional({ description: 'CILT type ID', example: 3 })
  @IsOptional()
  @IsNumber()
  ciltTypeId?: number;

  @ApiPropertyOptional({ description: 'CILT type name', example: 'TypeA' })
  @IsOptional()
  @IsString()
  ciltTypeName?: string;

  @ApiPropertyOptional({
    description: 'Reference OPL/SOP ID',
    example: 7,
  })
  @IsOptional()
  @IsNumber()
  referenceOplSopId?: number;

  @ApiPropertyOptional({
    description: 'Standard time in seconds',
    example: 90,
  })
  @IsOptional()
  @IsNumber()
  standardTime?: number;

  @ApiPropertyOptional({
    description: 'Expected standard',
    example: 'All welds must have no porosity',
  })
  @IsOptional()
  @IsString()
  standardOk?: string;

  @ApiPropertyOptional({
    description: 'Remediation OPL/SOP ID',
    example: 9,
  })
  @IsOptional()
  @IsNumber()
  remediationOplSopId?: number;

  @ApiPropertyOptional({
    description: 'Required tools',
    example: 'Helmet, Gloves',
  })
  @IsOptional()
  @IsString()
  toolsRequired?: string;

  @ApiPropertyOptional({
    description: 'Is it a stoppage reason? (1=yes, 0=no)',
    example: 0,
  })
  @IsOptional()
  @IsNumber()
  stoppageReason?: number;

  @ApiPropertyOptional({
    description: 'Is the machine stopped? (1=yes, 0=no)',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  machineStopped?: number;

  @ApiPropertyOptional({
    description: 'Number of pictures at start',
    example: 2,
  })
  @IsOptional()
  @IsNumber()
  quantityPicturesCreate?: number;

  @ApiPropertyOptional({
    description: 'Number of pictures at end',
    example: 2,
  })
  @IsOptional()
  @IsNumber()
  quantityPicturesClose?: number;

  @ApiPropertyOptional({
    description: 'Can be selected without programming (1=yes, 0=no)',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  selectableWithoutProgramming?: number;

  @ApiPropertyOptional({
    description: 'Sequence status (A=Active, I=Inactive, D=Draft)',
    example: 'A',
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ description: 'Update date in ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)', example: '2025-05-30T11:00:00.000Z' })
  @IsISO8601()
  updatedAt: string;
}
