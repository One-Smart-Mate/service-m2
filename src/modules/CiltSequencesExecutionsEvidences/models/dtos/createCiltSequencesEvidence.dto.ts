import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, IsISO8601 } from 'class-validator';

export class CreateCiltSequencesEvidenceDTO {
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

  @ApiProperty({ description: 'CILT Sequences Executions ID', required: false })
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
    description: 'Creation date in ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)', 
    default: '2023-06-20T00:00:00.000Z',
    required: false
  })
  @IsOptional()
  @IsISO8601()
  createdAt?: string;
} 