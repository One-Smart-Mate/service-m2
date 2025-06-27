import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsString } from 'class-validator';

export class FilterCiltSequencesEvidenceDTO {
  @ApiProperty({ description: 'ID of the CILT' })
  @IsOptional()
  @IsNumber()
  ciltId?: number;

  @ApiProperty({ description: 'ID of the sequence' })
  @IsOptional()
  @IsNumber()
  sequenceId?: number;

  @ApiProperty({ description: 'Type of the evidence' })
  @IsOptional()
  @IsString()
  evidenceType?: string;

  @ApiProperty({ description: 'Status of the evidence' })
  @IsOptional()
  @IsString()
  status?: string;
} 