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

  @ApiProperty({ description: 'Color code for the CILT type (hex format)', required: false, example: 'FF5733' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiProperty({ description: 'Creation date in ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)', default: '2023-06-20T00:00:00.000Z' })
  @IsISO8601()
  createdAt: string;
} 