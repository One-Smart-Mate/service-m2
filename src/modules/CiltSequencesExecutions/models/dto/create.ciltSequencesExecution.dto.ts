import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsString, IsISO8601 } from 'class-validator';

export class CreateCiltSequencesExecutionDTO {
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

  @ApiProperty({ description: 'CILT Sequence ID', required: false })
  @IsOptional()
  @IsNumber()
  ciltSecuenceId?: number;

  @ApiProperty({ description: 'Level ID', required: false })
  @IsOptional()
  @IsNumber()
  levelId?: number;

  @ApiProperty({ description: 'Route', required: false })
  @IsOptional()
  @IsString()
  route?: string;

  @ApiProperty({ description: 'User ID', required: false })
  @IsOptional()
  @IsNumber()
  userId?: number;

  @ApiProperty({ description: 'User who executed ID', required: false })
  @IsOptional()
  @IsNumber()
  userWhoExecutedId?: number;

  @ApiProperty({ description: 'Sequence schedule in ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)', required: false })
  @IsOptional()
  @IsISO8601()
  secuenceSchedule?: string;

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

  @ApiProperty({ description: 'Real duration in seconds', required: false })
  @IsOptional()
  @IsNumber()
  realDuration?: number;

  @ApiProperty({ description: 'Standard to meet', required: false })
  @IsOptional()
  @IsString()
  standardOk?: string;

  @ApiProperty({ description: 'Initial parameter', required: false })
  @IsOptional()
  @IsString()
  initialParameter?: string;

  @ApiProperty({ description: 'Evidence at creation', required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  evidenceAtCreation?: number;

  @ApiProperty({ description: 'Final parameter', required: false })
  @IsOptional()
  @IsString()
  finalParameter?: string;

  @ApiProperty({ description: 'Evidence at final', required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  evidenceAtFinal?: number;

  @ApiProperty({ description: 'NOK status', required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  nok?: number;

  @ApiProperty({ description: 'Stoppage reason', required: false })
  @IsOptional()
  @IsNumber()
  stoppageReason?: number;

  @ApiProperty({ description: 'Machine stopped', required: false })
  @IsOptional()
  @IsNumber()
  machineStopped?: number;

  @ApiProperty({ description: 'AM tag ID', required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  amTagId?: number;

  @ApiProperty({ description: 'Reference point', required: false })
  @IsOptional()
  @IsString()
  referencePoint?: string;

  @ApiProperty({ description: 'Sequence list', required: false })
  @IsOptional()
  @IsString()
  secuenceList?: string;

  @ApiProperty({ description: 'Sequence color in hexadecimal', required: false })
  @IsOptional()
  @IsString()
  secuenceColor?: string;

  @ApiProperty({ description: 'CILT type ID', required: false })
  @IsOptional()
  @IsNumber()
  ciltTypeId?: number;

  @ApiProperty({ description: 'CILT type name', required: false })
  @IsOptional()
  @IsString()
  ciltTypeName?: string;

  @ApiProperty({ description: 'Reference OPL/SOP ID', required: false })
  @IsOptional()
  @IsNumber()
  referenceOplSopId?: number;

  @ApiProperty({ description: 'Remediation OPL/SOP ID', required: false })
  @IsOptional()
  @IsString()
  remediationOplSopId?: string;

  @ApiProperty({ description: 'Tools required', required: false })
  @IsOptional()
  @IsString()
  toolsRequiered?: string;

  @ApiProperty({ description: 'Selectable without programming', required: false })
  @IsOptional()
  @IsNumber()
  selectableWithoutProgramming?: number;

  @ApiProperty({ description: 'Status (A=Active, I=Inactive, D=Draft)', required: false, default: 'A' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ description: 'Creation date in ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)', default: '2023-06-20T00:00:00.000Z' })
  @IsISO8601()
  createdAt: string;
} 