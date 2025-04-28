import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsOptional } from 'class-validator';

export class UpdateCiltSequencesEvidenceDTO {
  @ApiProperty({ description: 'ID of the evidence' })
  @IsNotEmpty()
  @IsNumber()
  id: number;

  @ApiProperty({ description: 'ID of the CILT' })
  @IsOptional()
  @IsNumber()
  ciltId?: number;

  @ApiProperty({ description: 'ID of the sequence' })
  @IsOptional()
  @IsNumber()
  sequenceId?: number;

  @ApiProperty({ description: 'URL of the evidence' })
  @IsOptional()
  @IsString()
  evidenceUrl?: string;

  @ApiProperty({ description: 'Type of the evidence' })
  @IsOptional()
  @IsString()
  evidenceType?: string;

  @ApiProperty({ description: 'Status of the evidence' })
  @IsOptional()
  @IsString()
  status?: string;
} 