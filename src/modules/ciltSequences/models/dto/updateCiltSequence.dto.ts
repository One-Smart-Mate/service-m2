import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsOptional } from 'class-validator';

export class UpdateCiltSequenceDTO {
  @ApiProperty({ description: 'ID of the sequence' })
  @IsNotEmpty()
  @IsNumber()
  id: number;

  @ApiProperty({ description: 'ID of the CILT' })
  @IsOptional()
  @IsNumber()
  ciltId?: number;

  @ApiProperty({ description: 'Number of the sequence' })
  @IsOptional()
  @IsNumber()
  sequenceNumber?: number;

  @ApiProperty({ description: 'Description of the sequence' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Status of the sequence' })
  @IsOptional()
  @IsString()
  status?: string;
} 