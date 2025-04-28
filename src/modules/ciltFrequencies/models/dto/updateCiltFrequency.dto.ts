import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber } from 'class-validator';

export class UpdateCiltFrequencyDTO {
  @ApiProperty({ description: 'ID de la frecuencia' })
  @IsNumber()
  id: number;

  @ApiProperty({ description: 'Nombre de la frecuencia', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Descripción de la frecuencia', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Número de días de la frecuencia', required: false })
  @IsOptional()
  @IsNumber()
  days?: number;

  @ApiProperty({ description: 'Estado de la frecuencia', required: false })
  @IsOptional()
  @IsString()
  status?: string;
} 