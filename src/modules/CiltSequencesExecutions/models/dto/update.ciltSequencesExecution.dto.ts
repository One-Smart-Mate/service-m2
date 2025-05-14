import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsNumber, IsString, IsISO8601 } from 'class-validator';

export class UpdateCiltSequencesExecutionDTO {
  @ApiProperty({ description: 'Execution ID' })
  @IsNotEmpty()
  @IsNumber()
  id: number;

  @ApiProperty({ description: 'Site ID', required: false })
  @IsOptional()
  @IsNumber()
  siteId?: number;

  @ApiProperty({ description: 'Position ID', required: false })
  @IsOptional()
  @IsNumber()
  positionId?: number;

  @ApiProperty({ description: 'CILT ID', required: false })
  @IsOptional()
  @IsNumber()
  ciltId?: number;

  @ApiProperty({ description: 'CILT Details ID', required: false })
  @IsOptional()
  @IsNumber()
  ciltDetailsId?: number;

  @ApiProperty({ description: 'Sequence start time in ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)', default: '2023-06-20T00:00:00.000Z', required: false })
  @IsOptional()
  @IsISO8601()
  secuenceStart?: string;

  @ApiProperty({ description: 'Sequence stop time in ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)', default: '2023-06-20T00:00:00.000Z', required: false })
  @IsOptional()
  @IsISO8601()
  secuenceStop?: string;

  @ApiProperty({ description: 'Duration in seconds', required: false })
  @IsOptional()
  @IsNumber()
  duration?: number;

  @ApiProperty({ description: 'Standard to meet', required: false })
  @IsOptional()
  @IsString()
  standardOk?: string;

  @ApiProperty({ description: 'Initial parameter', required: false })
  @IsOptional()
  @IsString()
  initialParameter?: string;

  @ApiProperty({ description: 'Evidence at creation', required: false })
  @IsOptional()
  @IsNumber()
  evidenceAtCreation?: number;

  @ApiProperty({ description: 'Final parameter', required: false })
  @IsOptional()
  @IsString()
  finalParameter?: string;

  @ApiProperty({ description: 'Evidence at final', required: false })
  @IsOptional()
  @IsNumber()
  evidenceAtFinal?: number;

  @ApiProperty({ description: 'Stoppage reason', default: "0", required: false })
  @IsOptional()
  @IsNumber()
  stoppageReason?: number;

  @ApiProperty({ description: 'AM tag', required: false })
  @IsOptional()
  @IsNumber()
  amTag?: number;

  @ApiProperty({ description: 'Scheduled run date/time in ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)', required: false })
  @IsOptional()
  @IsISO8601()
  runSecuenceSchedule?: string;

  @ApiProperty({ description: 'Update date in ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)', default: '2023-06-20T00:00:00.000Z' })
  @IsISO8601()
  updatedAt: string;
} 