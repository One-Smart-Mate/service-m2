import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsISO8601 } from 'class-validator';

export class CreateCiltTypeDTO {
  @ApiProperty({ description: 'Site ID', required: false })
  @IsOptional()
  @IsNumber()
  siteId?: number;

  @ApiProperty({ description: 'Name of the CILT type', default: 'CLEANING', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Status of the CILT type', default: 'A', required: false })
  @IsOptional()
  @IsString()
  status?: string;
} 