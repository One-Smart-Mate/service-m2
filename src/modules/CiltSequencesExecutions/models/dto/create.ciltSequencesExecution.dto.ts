import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsString, IsDate } from 'class-validator';

export class CreateCiltSequencesExecutionDTO {
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

  @ApiProperty({ description: 'Status of the execution', default: 'A' })
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