import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';

export class UpdateCiltTypeDTO {
  @ApiProperty({ description: 'ID of the CILT type' })
  @IsNotEmpty()
  @IsNumber()
  id: number;

  @ApiProperty({ description: 'Name of the CILT type' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Description of the CILT type' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Status of the CILT type' })
  @IsOptional()
  @IsString()
  status?: string;
} 