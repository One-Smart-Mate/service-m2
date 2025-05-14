import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsISO8601 } from 'class-validator';

export class UpdateCiltSequenceDTO {
  @ApiProperty({ description: 'Sequence ID' })
  @IsNotEmpty()
  @IsNumber()
  id: number;

  @ApiProperty({ description: 'Site ID', required: false })
  @IsOptional()
  @IsNumber()
  siteId?: number;

  @ApiProperty({ description: 'Site name', required: false })
  @IsOptional()
  @IsString()
  siteName?: string;

  @ApiProperty({ description: 'Area ID', required: false })
  @IsOptional()
  @IsNumber()
  areaId?: number;

  @ApiProperty({ description: 'Area name', required: false })
  @IsOptional()
  @IsString()
  areaName?: string;

  @ApiProperty({ description: 'Position ID', required: false })
  @IsOptional()
  @IsNumber()
  positionId?: number;

  @ApiProperty({ description: 'Position name', required: false })
  @IsOptional()
  @IsString()
  positionName?: string;

  @ApiProperty({ description: 'CILT master ID', required: false })
  @IsOptional()
  @IsNumber()
  ciltMstrId?: number;

  @ApiProperty({ description: 'CILT master name', required: false })
  @IsOptional()
  @IsString()
  ciltMstrName?: string;

  @ApiProperty({ description: 'Level ID', required: false })
  @IsOptional()
  @IsNumber()
  levelId?: number;

  @ApiProperty({ description: 'Level name', required: false })
  @IsOptional()
  @IsString()
  levelName?: string;

  @ApiProperty({ description: 'Route of the level', required: false })
  @IsOptional()
  @IsString()
  route?: string;

  @ApiProperty({ description: 'Sequence order', required: false })
  @IsOptional()
  @IsNumber()
  order?: number;

  @ApiProperty({ description: 'Sequence list', required: false })
  @IsOptional()
  @IsString()
  secuenceList?: string;

  @ApiProperty({ description: 'Sequence color in hexadecimal', required: false })
  @IsOptional()
  @IsString()
  secuenceColor?: string;

  @ApiProperty({ description: 'CILT type ID', required: false })
  @IsOptional()
  @IsNumber()
  ciltTypeId?: number;

  @ApiProperty({ description: 'CILT type name', required: false })
  @IsOptional()
  @IsString()
  ciltTypeName?: string;

  @ApiProperty({ description: 'OPL/SOP reference', required: false })
  @IsOptional()
  @IsNumber()
  referenceOplSop?: number;

  @ApiProperty({ description: 'Standard time in seconds', required: false })
  @IsOptional()
  @IsNumber()
  standardTime?: number;

  @ApiProperty({ description: 'Expected standard', required: false })
  @IsOptional()
  @IsString()
  standardOk?: string;

  @ApiProperty({ description: 'Remediation OPL/SOP', required: false })
  @IsOptional()
  @IsNumber()
  remediationOplSop?: number;

  @ApiProperty({ description: 'Required tools', required: false })
  @IsOptional()
  @IsString()
  toolsRequired?: string;

  @ApiProperty({ description: 'Is it a stoppage reason?', required: false })
  @IsOptional()
  @IsNumber()
  stoppageReason?: number;

  @ApiProperty({ description: 'Is the machine stopped?', required: false })
  @IsOptional()
  @IsNumber()
  machineStopped?: number;

  @ApiProperty({ description: 'Number of pictures at start', required: false })
  @IsOptional()
  @IsNumber()
  quantityPicturesCreate?: number;

  @ApiProperty({ description: 'Number of pictures at end', required: false })
  @IsOptional()
  @IsNumber()
  quantityPicturesClose?: number;

  @ApiProperty({ description: 'Sequence status (A=Active, I=Inactive, D=Draft)', required: false })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ description: 'Update date in ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)', default: '2023-06-20T00:00:00.000Z' })
  @IsISO8601()
  updatedAt: string;
} 