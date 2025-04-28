import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber } from 'class-validator';

export class CreateCiltFrequenciesDTO {
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

  @ApiProperty({ description: 'Estado de la frecuencia', required: false, default: 'A' })
  @IsOptional()
  @IsString()
  status?: string;
} 