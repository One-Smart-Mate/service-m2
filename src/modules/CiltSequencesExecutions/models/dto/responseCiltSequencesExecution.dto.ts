import { ApiProperty } from '@nestjs/swagger';

export class ResponseCiltSequencesExecutionDTO {
  @ApiProperty({ description: 'ID de la ejecución' })
  id: number;

  @ApiProperty({ description: 'Site ID' })
  siteId: number;

  @ApiProperty({ description: 'ID de la posición' })
  positionId: number;

  @ApiProperty({ description: 'ID del CILT' })
  ciltId: number;

  @ApiProperty({ description: 'ID del detalle del CILT' })
  ciltDetailsId: number;

  @ApiProperty({ description: 'Momento de inicio de la secuencia' })
  secuenceStart: Date;

  @ApiProperty({ description: 'Momento de fin de la secuencia' })
  secuenceStop: Date;

  @ApiProperty({ description: 'Duración de la ejecución en segundos' })
  duration: number;

  @ApiProperty({ description: 'Estándar que se debe cumplir' })
  standardOk: string;

  @ApiProperty({ description: 'Parámetro inicial' })
  initialParameter: string;

  @ApiProperty({ description: '¿Hay evidencia al inicio?' })
  evidenceAtCreation: number;

  @ApiProperty({ description: 'Parámetro final' })
  finalParameter: string;

  @ApiProperty({ description: '¿Hay evidencia al final?' })
  evidenceAtFinal: number;

  @ApiProperty({ description: '¿Es motivo de paro?' })
  stoppageReason: number;

  @ApiProperty({ description: '¿Tiene tarjeta AM?' })
  amTag: number;

  @ApiProperty({ description: 'Fecha de creación' })
  createdAt: Date;

  @ApiProperty({ description: 'Fecha de actualización' })
  updatedAt: Date;
} 