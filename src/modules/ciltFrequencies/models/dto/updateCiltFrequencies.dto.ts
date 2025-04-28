import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';

export class UpdateCiltFrequenciesDTO {
  @ApiProperty({ description: 'ID de la frecuencia' })
  @IsNotEmpty()
  @IsNumber()
  id: number;

  @ApiProperty({ description: 'Site ID', required: false })
  @IsOptional()
  @IsNumber()
  siteId?: number;

  @ApiProperty({ description: 'Código de la frecuencia (IT=Inicio de turno, FT=Fin de turno, CP=Cambio de formato, RUN=Maquina funcionando)', required: false })
  @IsOptional()
  @IsString()
  frecuencyCode?: string;

  @ApiProperty({ description: 'Descripción de la frecuencia', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Estado de la frecuencia', required: false })
  @IsOptional()
  @IsString()
  status?: string;
} 