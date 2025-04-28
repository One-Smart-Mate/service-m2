import { ApiProperty } from '@nestjs/swagger';

export class ResponseCiltSequencesFrequenciesDTO {
  @ApiProperty({ description: 'ID de la frecuencia de secuencia' })
  id: number;

  @ApiProperty({ description: 'Site ID' })
  siteId: number;

  @ApiProperty({ description: 'ID de la posición' })
  positionId: number;

  @ApiProperty({ description: 'ID del CILT' })
  ciltId: number;

  @ApiProperty({ description: 'ID de la secuencia' })
  secuencyId: number;

  @ApiProperty({ description: 'ID de la frecuencia' })
  frecuencyId: number;

  @ApiProperty({ description: 'Código de la frecuencia' })
  frecuencyCode: string;

  @ApiProperty({ description: 'Estado' })
  status: string;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
} 