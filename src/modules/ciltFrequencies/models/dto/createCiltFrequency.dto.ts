import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber } from 'class-validator';

export class CreateCiltFrequencyDTO {
  @ApiProperty({ description: 'Nombre de la frecuencia' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Descripción de la frecuencia' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ description: 'Número de días de la frecuencia' })
  @IsNotEmpty()
  @IsNumber()
  days: number;

  @ApiProperty({ description: 'Estado de la frecuencia', default: 'A' })
  @IsNotEmpty()
  @IsString()
  status: string;
} 