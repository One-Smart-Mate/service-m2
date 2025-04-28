import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber } from 'class-validator';

export class CreateCiltSequencesEvidenceDTO {
  @ApiProperty({ description: 'ID del CILT' })
  @IsNotEmpty()
  @IsNumber()
  ciltId: number;

  @ApiProperty({ description: 'Tipo de evidencia' })
  @IsNotEmpty()
  @IsString()
  evidenceType: string;

  @ApiProperty({ description: 'URL de la evidencia' })
  @IsNotEmpty()
  @IsString()
  evidenceUrl: string;

  @ApiProperty({ description: 'Descripción de la evidencia' })
  @IsNotEmpty()
  @IsString()
  description: string;
} 