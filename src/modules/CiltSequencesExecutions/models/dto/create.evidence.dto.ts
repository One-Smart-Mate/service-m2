import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min, IsString, MaxLength, IsNotEmpty, IsDateString, IsOptional, IsEnum } from 'class-validator';
import { CiltSequencesExecutionsEvidencesType } from 'src/modules/CiltSequencesExecutionsEvidences/models/dtos/createCiltSequencesEvidence.dto';

export class CreateEvidenceDTO {
  @ApiProperty({ description: 'Execution ID', example: 1 })
  @IsInt()
  @Min(1)
  executionId: number;

  @ApiProperty({ description: 'Evidence URL', example: 'https://example.com/evidence/image.jpg' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  evidenceUrl: string;

  @ApiProperty({ 
    description: 'Type of evidence', 
    required: false,
    example: 'INITIAL'
  })
  @IsOptional()
  @IsEnum(CiltSequencesExecutionsEvidencesType)
  type?: CiltSequencesExecutionsEvidencesType;

  @ApiProperty({ description: 'Created date', example: '2023-06-20T00:00:00.000Z' })
  @IsDateString()
  createdAt: string;
} 