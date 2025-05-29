import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsISO8601 } from 'class-validator';

export class CreateCiltSequenceDTO {
  @ApiProperty({ description: 'Site ID', required: false })
  @IsOptional()
  @IsNumber()
  siteId?: number;

  @ApiProperty({ description: 'Site name', required: false })
  @IsOptional()
  @IsString()
  siteName?: string;

  @ApiProperty({ description: 'CILT master ID', required: false })
  @IsOptional()
  @IsNumber()
  ciltMstrId?: number;

  @ApiProperty({ description: 'CILT master name', required: false })
  @IsOptional()
  @IsString()
  ciltMstrName?: string;

  @ApiProperty({ description: 'Frequency ID', required: false })
  @IsOptional()
  @IsNumber()
  frecuencyId?: number;

  @ApiProperty({ description: 'Frequency code', required: false })
  @IsOptional()
  @IsString()
  frecuencyCode?: string;

  @ApiProperty({ description: 'Reference point', required: false })
  @IsOptional()
  @IsString()
  referencePoint?: string;

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

  @ApiProperty({ description: 'Reference OPL/SOP ID', required: false })
  @IsOptional()
  @IsNumber()
  referenceOplSopId?: number;

  @ApiProperty({ description: 'Standard time in seconds', required: false })
  @IsOptional()
  @IsNumber()
  standardTime?: number;

  @ApiProperty({ description: 'Creation date in ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)', default: '2023-06-20T00:00:00.000Z' })
  @IsISO8601()
  createdAt: string;
} 