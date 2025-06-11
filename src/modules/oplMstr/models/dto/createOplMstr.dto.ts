import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsEnum, IsNumber, IsISO8601 } from 'class-validator';

export class CreateOplMstrDTO {
  @ApiProperty({ description: 'Title of the OPL' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ description: 'Site ID of the OPL' })
  @IsNotEmpty()
  @IsNumber()
  siteId: number;

  @ApiProperty({ description: 'Objective of the OPL', required: false })
  @IsOptional()
  @IsString()
  objetive?: string;

  @ApiProperty({ description: 'ID of the creator', required: false })
  @IsOptional()
  @IsNumber()
  creatorId?: number;

  @ApiProperty({ description: 'Name of the creator', required: false })
  @IsOptional()
  @IsString()
  creatorName?: string;

  @ApiProperty({ description: 'ID of the reviewer', required: false })
  @IsOptional()
  @IsNumber()
  reviewerId?: number;

  @ApiProperty({ description: 'Name of the reviewer', required: false })
  @IsOptional()
  @IsString()
  reviewerName?: string;

  @ApiProperty({ description: 'Type of OPL', enum: ['opl', 'sop'], required: false })
  @IsOptional()
  @IsEnum(['opl', 'sop'])
  oplType?: 'opl' | 'sop';

  @ApiProperty({ description: 'Creation date in ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)', default: '2023-06-20T00:00:00.000Z' })
  @IsISO8601()
  createdAt: string;
} 