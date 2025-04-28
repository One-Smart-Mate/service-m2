import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber } from 'class-validator';

export class CreateCiltTypeDTO {
  @ApiProperty({ description: 'Site ID', required: false })
  @IsOptional()
  @IsNumber()
  siteId?: number;

  @ApiProperty({ description: 'Name of the CILT type', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Status of the CILT type', required: false, default: 'A' })
  @IsOptional()
  @IsString()
  status?: string;
} 