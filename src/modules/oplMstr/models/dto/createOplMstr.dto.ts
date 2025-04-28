import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateOplMstrDTO {
  @ApiProperty({ description: 'Name of the OPL' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Description of the OPL' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Status of the OPL', default: 'A' })
  @IsNotEmpty()
  @IsString()
  status: string;
} 