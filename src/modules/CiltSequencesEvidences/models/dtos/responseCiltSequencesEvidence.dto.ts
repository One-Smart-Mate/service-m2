import { ApiProperty } from '@nestjs/swagger';

export class ResponseCiltSequencesEvidenceDTO {
  @ApiProperty({ description: 'ID of the evidence' })
  id: number;

  @ApiProperty({ description: 'ID of the CILT' })
  ciltId: number;

  @ApiProperty({ description: 'ID of the sequence' })
  sequenceId: number;

  @ApiProperty({ description: 'URL of the evidence' })
  evidenceUrl: string;

  @ApiProperty({ description: 'Type of the evidence' })
  evidenceType: string;

  @ApiProperty({ description: 'Status of the evidence' })
  status: string;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
} 