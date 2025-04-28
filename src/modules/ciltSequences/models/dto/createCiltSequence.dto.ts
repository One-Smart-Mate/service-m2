import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber } from 'class-validator';

export class CreateCiltSequenceDTO {
  @ApiProperty({ description: 'Site ID', required: false })
  @IsOptional()
  @IsNumber()
  siteId?: number;

  @ApiProperty({ description: 'Nombre del sitio', required: false })
  @IsOptional()
  @IsString()
  siteName?: string;

  @ApiProperty({ description: 'ID del área', required: false })
  @IsOptional()
  @IsNumber()
  areaId?: number;

  @ApiProperty({ description: 'Nombre del área', required: false })
  @IsOptional()
  @IsString()
  areaName?: string;

  @ApiProperty({ description: 'ID de la posición', required: false })
  @IsOptional()
  @IsNumber()
  positionId?: number;

  @ApiProperty({ description: 'Nombre de la posición' })
  @IsString()
  positionName: string;

  @ApiProperty({ description: 'ID del CILT maestro', required: false })
  @IsOptional()
  @IsNumber()
  ciltMstrId?: number;

  @ApiProperty({ description: 'Nombre del CILT maestro', required: false })
  @IsOptional()
  @IsString()
  ciltMstrName?: string;

  @ApiProperty({ description: 'ID del nivel', required: false })
  @IsOptional()
  @IsNumber()
  levelId?: number;

  @ApiProperty({ description: 'Nombre del nivel', required: false })
  @IsOptional()
  @IsString()
  levelName?: string;

  @ApiProperty({ description: 'Orden de la secuencia', required: false })
  @IsOptional()
  @IsNumber()
  order?: number;

  @ApiProperty({ description: 'Lista de secuencias', required: false })
  @IsOptional()
  @IsString()
  secuenceList?: string;

  @ApiProperty({ description: 'Color de la secuencia en hexadecimal', required: false })
  @IsOptional()
  @IsString()
  secuenceColor?: string;

  @ApiProperty({ description: 'ID del tipo de CILT', required: false })
  @IsOptional()
  @IsNumber()
  ciltTypeId?: number;

  @ApiProperty({ description: 'Nombre del tipo de CILT', required: false })
  @IsOptional()
  @IsString()
  ciltTypeName?: string;

  @ApiProperty({ description: 'Referencia OPL/SOP', required: false })
  @IsOptional()
  @IsNumber()
  referenceOplSop?: number;

  @ApiProperty({ description: 'Tiempo estándar en segundos', required: false })
  @IsOptional()
  @IsNumber()
  standardTime?: number;

  @ApiProperty({ description: 'Estándar esperado', required: false })
  @IsOptional()
  @IsString()
  standardOk?: string;

  @ApiProperty({ description: 'OPL/SOP de remediación', required: false })
  @IsOptional()
  @IsNumber()
  remediationOplSop?: number;

  @ApiProperty({ description: 'Herramientas requeridas', required: false })
  @IsOptional()
  @IsString()
  toolsRequired?: string;

  @ApiProperty({ description: '¿Es motivo de paro?', required: false })
  @IsOptional()
  @IsNumber()
  stoppageReason?: number;

  @ApiProperty({ description: 'Cantidad de imágenes al inicio', required: false, default: 1 })
  @IsOptional()
  @IsNumber()
  quantityPicturesCreate?: number;

  @ApiProperty({ description: 'Cantidad de imágenes al final', required: false, default: 1 })
  @IsOptional()
  @IsNumber()
  quantityPicturesClose?: number;
} 