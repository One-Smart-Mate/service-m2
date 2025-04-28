import { ApiProperty } from '@nestjs/swagger';

export class ResponseCiltSequenceDTO {
  @ApiProperty({ description: 'ID de la secuencia' })
  id: number;

  @ApiProperty({ description: 'Site ID', required: false })
  siteId?: number;

  @ApiProperty({ description: 'Nombre del sitio', required: false })
  siteName?: string;

  @ApiProperty({ description: 'ID del área', required: false })
  areaId?: number;

  @ApiProperty({ description: 'Nombre del área', required: false })
  areaName?: string;

  @ApiProperty({ description: 'ID de la posición', required: false })
  positionId?: number;

  @ApiProperty({ description: 'Nombre de la posición' })
  positionName: string;

  @ApiProperty({ description: 'ID del CILT maestro', required: false })
  ciltMstrId?: number;

  @ApiProperty({ description: 'Nombre del CILT maestro', required: false })
  ciltMstrName?: string;

  @ApiProperty({ description: 'ID del nivel', required: false })
  levelId?: number;

  @ApiProperty({ description: 'Nombre del nivel', required: false })
  levelName?: string;

  @ApiProperty({ description: 'Orden de la secuencia', required: false })
  order?: number;

  @ApiProperty({ description: 'Lista de secuencias', required: false })
  secuenceList?: string;

  @ApiProperty({ description: 'Color de la secuencia en hexadecimal', required: false })
  secuenceColor?: string;

  @ApiProperty({ description: 'ID del tipo de CILT', required: false })
  ciltTypeId?: number;

  @ApiProperty({ description: 'Nombre del tipo de CILT', required: false })
  ciltTypeName?: string;

  @ApiProperty({ description: 'Referencia OPL/SOP', required: false })
  referenceOplSop?: number;

  @ApiProperty({ description: 'Tiempo estándar en segundos', required: false })
  standardTime?: number;

  @ApiProperty({ description: 'Estándar esperado', required: false })
  standardOk?: string;

  @ApiProperty({ description: 'OPL/SOP de remediación', required: false })
  remediationOplSop?: number;

  @ApiProperty({ description: 'Herramientas requeridas', required: false })
  toolsRequired?: string;

  @ApiProperty({ description: '¿Es motivo de paro?', required: false })
  stoppageReason?: number;

  @ApiProperty({ description: 'Cantidad de imágenes al inicio', required: false })
  quantityPicturesCreate?: number;

  @ApiProperty({ description: 'Cantidad de imágenes al final', required: false })
  quantityPicturesClose?: number;

  @ApiProperty({ description: 'Fecha de creación', required: false })
  createdAt?: Date;

  @ApiProperty({ description: 'Fecha de actualización', required: false })
  updatedAt?: Date;
} 