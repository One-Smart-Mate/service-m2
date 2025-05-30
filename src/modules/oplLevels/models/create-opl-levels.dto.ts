import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsOptional, IsISO8601 } from 'class-validator';

export class CreateOplLevelsDTO {
  @ApiProperty({ description: 'Site ID', example: 1, required: false })
  @IsOptional()
  @IsNumber()
  siteId?: number;

  @ApiProperty({ description: 'Opl ID', example: 1 })
  @IsNotEmpty()
  @IsNumber()
  oplId: number;

  @ApiProperty({ description: 'Level ID', example: 1 })
  @IsNotEmpty()
  @IsNumber()
  levelId: number;
} 