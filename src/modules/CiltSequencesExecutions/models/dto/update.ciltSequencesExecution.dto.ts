import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsOptional, IsDate } from 'class-validator';

export class UpdateCiltSequencesExecutionDTO {
  @ApiProperty({ description: 'ID of the execution' })
  @IsNotEmpty()
  @IsNumber()
  id: number;

  @ApiProperty({ description: 'ID of the CILT' })
  @IsOptional()
  @IsNumber()
  ciltId?: number;

  @ApiProperty({ description: 'ID of the sequence' })
  @IsOptional()
  @IsNumber()
  sequenceId?: number;

  @ApiProperty({ description: 'ID of the user' })
  @IsOptional()
  @IsNumber()
  userId?: number;

  @ApiProperty({ description: 'Name of the user' })
  @IsOptional()
  @IsString()
  userName?: string;

  @ApiProperty({ description: 'Status of the execution' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ description: 'Date of execution' })
  @IsOptional()
  @IsDate()
  executionDate?: Date;

  @ApiProperty({ description: 'Notes of the execution' })
  @IsOptional()
  @IsString()
  notes?: string;
} 