import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsDateString } from 'class-validator';

export class CreateEvidenceDTO {
  @ApiProperty({ description: 'Execution ID', example: 1 })
  @IsNumber()
  executionId: number;

  @ApiProperty({ description: 'Evidence URL', example: 'https://example.com/evidence/image.jpg' })
  @IsString()
  evidenceUrl: string;

  @ApiProperty({ description: 'Created date', example: '2023-06-20T00:00:00.000Z' })
  @IsDateString()
  createdAt: string;
} 