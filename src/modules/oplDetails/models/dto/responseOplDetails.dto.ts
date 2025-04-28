import { ApiProperty } from '@nestjs/swagger';

export class ResponseOplDetailsDTO {
  @ApiProperty({ description: 'ID of the detail' })
  id: number;

  @ApiProperty({ description: 'ID of the OPL' })
  oplId: number;

  @ApiProperty({ description: 'Name of the detail' })
  name: string;

  @ApiProperty({ description: 'Description of the detail' })
  description: string;

  @ApiProperty({ description: 'Status of the detail' })
  status: string;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
} 