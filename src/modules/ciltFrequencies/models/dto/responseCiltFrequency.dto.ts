import { ApiProperty } from '@nestjs/swagger';

export class ResponseCiltFrequencyDTO {
  @ApiProperty({ description: 'ID de la frecuencia' })
  id: number;

  @ApiProperty({ description: 'Nombre de la frecuencia' })
  name: string;

  @ApiProperty({ description: 'Descripción de la frecuencia' })
  description: string;

  @ApiProperty({ description: 'Número de días de la frecuencia' })
  days: number;

  @ApiProperty({ description: 'Estado de la frecuencia' })
  status: string;

  @ApiProperty({ description: 'Fecha de creación' })
  createdAt: Date;

  @ApiProperty({ description: 'Fecha de actualización' })
  updatedAt: Date;
} 