import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsOptional, IsISO8601 } from 'class-validator';

export class UpdateCiltTypeDTO {
  @ApiProperty({ description: 'ID of the CILT type' })
  @IsNotEmpty()
  @IsNumber()
  id: number;

  @ApiProperty({ description: 'Site ID', required: false })
  @IsOptional()
  @IsNumber()
  siteId?: number;

  @ApiProperty({ description: 'Name of the CILT type', default: 'CILT', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Status of the CILT type', default: 'A', required: false })
  @IsOptional()
  @IsString()
  status?: string;

} 