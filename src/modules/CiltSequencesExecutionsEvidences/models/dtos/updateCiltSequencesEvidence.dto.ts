import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { CiltSequencesExecutionsEvidencesType } from './createCiltSequencesEvidence.dto';

export class UpdateCiltSequencesEvidenceDTO {
  @ApiProperty({ description: 'Evidence ID' })
  @IsNotEmpty()
  @IsNumber()
  id: number;

  @ApiProperty({ description: 'Site ID', required: false })
  @IsOptional()
  @IsNumber()
  siteId?: number;

  @ApiProperty({ description: 'Position ID', required: false })
  @IsOptional()
  @IsNumber()
  positionId?: number;

  @ApiProperty({ description: 'CILT ID', required: false })
  @IsOptional()
  @IsNumber()
  ciltId?: number;

  @ApiProperty({ description: 'CILT Executions Evidence ID', required: false })
  @IsOptional()
  @IsNumber()
  ciltSequencesExecutionsId?: number;

  @ApiProperty({ 
    description: 'Evidence URL', 
    required: false,
    example: 'https://example.com/evidence/image.jpg'
  })
  @IsOptional()
  @IsString()
  evidenceUrl?: string;

  @ApiProperty({ 
    description: 'Type of evidence', 
    required: false,
    example: 'FINAL'
  })
  @IsOptional()
  @IsEnum(CiltSequencesExecutionsEvidencesType)
  type?: CiltSequencesExecutionsEvidencesType;
} 