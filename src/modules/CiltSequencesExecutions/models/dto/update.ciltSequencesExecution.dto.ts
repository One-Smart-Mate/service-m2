import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsNumber, IsString, IsISO8601, IsBoolean, IsEnum } from 'class-validator';

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

  @ApiProperty({ description: 'Special warning', required: false })
  @IsOptional()
  @IsString()
  specialWarning?: string;

  @ApiProperty({ description: 'Machine status', required: false, enum: ['running', 'stop'] })
  @IsOptional()
  @IsEnum(['running', 'stop'])
  machineStatus?: 'running' | 'stop' | null;

  @ApiProperty({ description: 'Sequence schedule in ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)', required: false })
  @IsOptional()
  @IsISO8601()
  secuenceSchedule?: string;

  @ApiProperty({ description: 'Allow execute before', required: false })
  @IsOptional()
  @IsBoolean()
  allowExecuteBefore?: boolean;

  @ApiProperty({ description: 'Allow execute before minutes', required: false })
  @IsOptional()
  @IsNumber()
  allowExecuteBeforeMinutes?: number;

  @ApiProperty({ description: 'Tolerance before minutes', required: false })
  @IsOptional()
  @IsNumber()
  toleranceBeforeMinutes?: number;

  @ApiProperty({ description: 'Tolerance after minutes', required: false })
  @IsOptional()
  @IsNumber()
  toleranceAfterMinutes?: number;

  @ApiProperty({ description: 'Allow execute after due', required: false })
  @IsOptional()
  @IsBoolean()
  allowExecuteAfterDue?: boolean;

  @ApiProperty({ description: 'Sequence start time in ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)', required: false })
  @IsOptional()
  @IsISO8601()
  secuenceStart?: string;

  @ApiProperty({ description: 'Sequence stop time in ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)', required: false })
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

  @ApiProperty({ description: 'Evidence at creation', required: false })
  @IsOptional()
  @IsBoolean()
  evidenceAtCreation?: boolean;

  @ApiProperty({ description: 'Final parameter', required: false })
  @IsOptional()
  @IsString()
  finalParameter?: string;

  @ApiProperty({ description: 'Evidence at final', required: false })
  @IsOptional()
  @IsBoolean()
  evidenceAtFinal?: boolean;

  @ApiProperty({ description: 'NOK status', required: false })
  @IsOptional()
  @IsBoolean()
  nok?: boolean;

  @ApiProperty({ description: 'Stoppage reason', required: false })
  @IsOptional()
  @IsBoolean()
  stoppageReason?: boolean;

  @ApiProperty({ description: 'Machine stopped', required: false })
  @IsOptional()
  @IsBoolean()
  machineStopped?: boolean;

  @ApiProperty({ description: 'AM tag ID', required: false })
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
  @IsNumber()
  remediationOplSopId?: number;

  @ApiProperty({ description: 'Tools required', required: false })
  @IsOptional()
  @IsString()
  toolsRequiered?: string;

  @ApiProperty({ description: 'Selectable without programming', required: false })
  @IsOptional()
  @IsBoolean()
  selectableWithoutProgramming?: boolean;

  @ApiProperty({ description: 'Status (A=Active, I=Inactive, D=Draft)', required: false })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ description: 'Update date in ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)', default: '2023-06-20T00:00:00.000Z' })
  @IsISO8601()
  updatedAt: string;
} 