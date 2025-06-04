import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsISO8601, IsBoolean, IsOptional, IsString } from 'class-validator';

export class StopCiltSequencesExecutionDTO {
  @ApiProperty({ description: 'Execution ID', default: 1 })
  @IsNotEmpty()
  @IsNumber()
  id: number;

  @ApiProperty({ type: 'string', format: 'date-time', example: '2023-06-20T00:00:00.000Z' })
  @IsNotEmpty()
  @IsISO8601()
  stopDate: string;

  @ApiProperty({ description: 'Initial parameter value', required: false })
  @IsOptional()
  @IsString()
  initialParameter?: string;

  @ApiProperty({ description: 'Whether evidence was captured at creation', default: false })
  @IsOptional()
  @IsBoolean()
  evidenceAtCreation?: boolean;

  @ApiProperty({ description: 'Final parameter value', required: false })
  @IsOptional()
  @IsString()
  finalParameter?: string;

  @ApiProperty({ description: 'Whether evidence was captured at final', default: false })
  @IsOptional()
  @IsBoolean()
  evidenceAtFinal?: boolean;

  @ApiProperty({ description: 'Whether the result was NOK', default: false })
  @IsOptional()
  @IsBoolean()
  nok?: boolean;

  @ApiProperty({ description: 'AM card ID if generated', required: false })
  @IsOptional()
  @IsNumber()
  amTagId?: number;
} 