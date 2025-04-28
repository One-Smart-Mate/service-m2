import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateCiltSequencesEvidenceDTO {
  @ApiProperty({ description: 'Evidence ID' })
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
  ciltExecutionsEvidencesId?: number;

  @ApiProperty({ description: 'Evidence URL', required: false })
  @IsOptional()
  @IsString()
  evidenceUrl?: string;
} 