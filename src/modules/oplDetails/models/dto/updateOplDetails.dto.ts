import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';

export class UpdateOplDetailsDTO {
  @ApiProperty({ description: 'ID of the detail' })
  @IsNotEmpty()
  @IsNumber()
  id: number;

  @ApiProperty({ description: 'ID of the OPL' })
  @IsOptional()
  @IsNumber()
  oplId?: number;

  @ApiProperty({ description: 'Name of the detail' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Description of the detail' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Status of the detail' })
  @IsOptional()
  @IsString()
  status?: string;
} 