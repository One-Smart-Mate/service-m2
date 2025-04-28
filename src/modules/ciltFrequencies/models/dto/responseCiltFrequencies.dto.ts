import { ApiProperty } from '@nestjs/swagger';

export class ResponseCiltFrequencyDTO {
  @ApiProperty({ description: 'ID de la frecuencia' })
  id: number;

  @ApiProperty({ description: 'Site ID' })
  siteId: number;

  @ApiProperty({ description: 'Código de la frecuencia (IT=Inicio de turno, FT=Fin de turno, CP=Cambio de formato, RUN=Maquina funcionando)' })
  frecuencyCode: string;

  @ApiProperty({ description: 'Descripción de la frecuencia' })
  description: string;

  @ApiProperty({ description: 'Estado de la frecuencia' })
  status: string;
} 