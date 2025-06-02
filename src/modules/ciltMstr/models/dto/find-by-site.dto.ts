import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsISO8601 } from 'class-validator';

export class FindBySiteDTO {
  @ApiProperty({ description: 'Site ID' })
  @IsNotEmpty()
  @IsNumber()
  siteId: number;

  @ApiProperty({ description: 'Date in YYYY-MM-DD format', example: '2025-01-01' })
  @IsNotEmpty()
  @IsString()
  @IsISO8601()
  date: string;
} 