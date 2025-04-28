import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateOplDetailsDTO {
  @ApiProperty({ description: 'ID of the OPL' })
  @IsNotEmpty()
  @IsNumber()
  oplId: number;

  @ApiProperty({ description: 'Name of the detail' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Description of the detail' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Status of the detail', default: 'A' })
  @IsNotEmpty()
  @IsString()
  status: string;
} 