import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsNumber, IsString, IsDate } from 'class-validator';

export class UpdateCiltSequencesExecutionDTO {
  @ApiProperty({ description: 'ID de la ejecución' })
  @IsNotEmpty()
  @IsNumber()
  id: number;

  @ApiProperty({ description: 'Site ID', required: false })
  @IsOptional()
  @IsNumber()
  siteId?: number;

  @ApiProperty({ description: 'ID de la posición', required: false })
  @IsOptional()
  @IsNumber()
  positionId?: number;

  @ApiProperty({ description: 'ID del CILT', required: false })
  @IsOptional()
  @IsNumber()
  ciltId?: number;

  @ApiProperty({ description: 'ID del detalle del CILT', required: false })
  @IsOptional()
  @IsNumber()
  ciltDetailsId?: number;

  @ApiProperty({ description: 'Momento de inicio de la secuencia', required: false })
  @IsOptional()
  @IsDate()
  secuenceStart?: Date;

  @ApiProperty({ description: 'Momento de fin de la secuencia', required: false })
  @IsOptional()
  @IsDate()
  secuenceStop?: Date;

  @ApiProperty({ description: 'Duración en segundos', required: false })
  @IsOptional()
  @IsNumber()
  duration?: number;

  @ApiProperty({ description: 'Estándar a cumplir', required: false })
  @IsOptional()
  @IsString()
  standardOk?: string;

  @ApiProperty({ description: 'Parámetro inicial', required: false })
  @IsOptional()
  @IsString()
  initialParameter?: string;

  @ApiProperty({ description: 'Evidencia al inicio', required: false })
  @IsOptional()
  @IsNumber()
  evidenceAtCreation?: number;

  @ApiProperty({ description: 'Parámetro final', required: false })
  @IsOptional()
  @IsString()
  finalParameter?: string;

  @ApiProperty({ description: 'Evidencia al final', required: false })
  @IsOptional()
  @IsNumber()
  evidenceAtFinal?: number;

  @ApiProperty({ description: 'Motivo de paro', required: false })
  @IsOptional()
  @IsNumber()
  stoppageReason?: number;

  @ApiProperty({ description: 'Tag AM', required: false })
  @IsOptional()
  @IsNumber()
  amTag?: number;
} 