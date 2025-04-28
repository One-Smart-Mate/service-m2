import { ApiProperty } from '@nestjs/swagger';

export class ResponseCiltSequencesFrequenciesDTO {
  @ApiProperty({ description: 'ID of the frequency' })
  id: number;

  @ApiProperty({ description: 'ID of the CILT sequence' })
  ciltSecuenceId: number;

  @ApiProperty({ description: 'ID of the frequency' })
  frecuencyId: number;

  @ApiProperty({ description: 'Status of the frequency' })
  status: string;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
} 