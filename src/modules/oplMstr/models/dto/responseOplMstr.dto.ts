import { ApiProperty } from '@nestjs/swagger';

export class ResponseOplMstrDTO {
  @ApiProperty({ description: 'ID of the OPL' })
  id: number;

  @ApiProperty({ description: 'Name of the OPL' })
  name: string;

  @ApiProperty({ description: 'Description of the OPL' })
  description: string;

  @ApiProperty({ description: 'Status of the OPL' })
  status: string;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
} 