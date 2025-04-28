import { ApiProperty } from '@nestjs/swagger';

export class ResponseCiltSequenceDTO {
  @ApiProperty({ description: 'ID of the sequence' })
  id: number;

  @ApiProperty({ description: 'ID of the CILT' })
  ciltId: number;

  @ApiProperty({ description: 'Number of the sequence' })
  sequenceNumber: number;

  @ApiProperty({ description: 'Description of the sequence' })
  description: string;

  @ApiProperty({ description: 'Status of the sequence' })
  status: string;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
} 