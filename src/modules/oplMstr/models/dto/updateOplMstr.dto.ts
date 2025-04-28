import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';

export class UpdateOplMstrDTO {
  @ApiProperty({ description: 'ID of the OPL' })
  @IsNotEmpty()
  @IsNumber()
  id: number;

  @ApiProperty({ description: 'Name of the OPL' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Description of the OPL' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Status of the OPL' })
  @IsOptional()
  @IsString()
  status?: string;
} 