import { IsNotEmpty, IsNumber, IsString, IsOptional, IsISO8601 } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCiltMstrPositionLevelsDto {
  @ApiProperty({ description: 'Site ID', example: 1 })
  @IsNotEmpty()
  @IsNumber()
  siteId: number;

  @ApiProperty({ description: 'CILT Master ID', example: 1 })
  @IsNotEmpty()
  @IsNumber()
  ciltMstrId: number;

  @ApiProperty({ description: 'Position ID', example: 1 })
  @IsNotEmpty()
  @IsNumber()
  positionId: number;

  @ApiProperty({ description: 'Level ID', example: 1 })
  @IsNotEmpty()
  @IsNumber()
  levelId: number;

  @ApiProperty({ description: 'Status', example: 'A', required: false })
  @IsOptional()
  @IsString()
  status?: string;
} 