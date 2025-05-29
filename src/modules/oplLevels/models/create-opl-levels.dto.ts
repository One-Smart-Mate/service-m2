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

  @ApiProperty({ description: 'Creation date in ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)', default: '2023-06-20T00:00:00.000Z' })
  @IsISO8601()
  createdAt: string;
} 