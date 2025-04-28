import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateCiltTypeDTO {
  @ApiProperty({ description: 'Name of the CILT type' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Description of the CILT type' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Status of the CILT type', default: 'A' })
  @IsNotEmpty()
  @IsString()
  status: string;
} 