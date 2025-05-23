import { PartialType } from '@nestjs/swagger';
import { CreateCiltMstrPositionLevelsDto } from './create.ciltMstrPositionLevels.dto';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCiltMstrPositionLevelsDto extends PartialType(CreateCiltMstrPositionLevelsDto) {
  @ApiProperty({ description: 'ID of the CILT Position Level', example: 1 })
  @IsNotEmpty()
  @IsNumber()
  id: number;

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
