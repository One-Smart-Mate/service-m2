import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateCiltSequencesFrequenciesDTO {
  @ApiProperty({ description: 'ID de la frecuencia de secuencia' })
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

  @ApiProperty({ description: 'ID de la secuencia', required: false })
  @IsOptional()
  @IsNumber()
  secuencyId?: number;

  @ApiProperty({ description: 'ID de la frecuencia', required: false })
  @IsOptional()
  @IsNumber()
  frecuencyId?: number;

  @ApiProperty({ description: 'Código de la frecuencia', required: false })
  @IsOptional()
  @IsString()
  frecuencyCode?: string;

  @ApiProperty({ description: 'Estado', required: false })
  @IsOptional()
  @IsString()
  status?: string;
} 