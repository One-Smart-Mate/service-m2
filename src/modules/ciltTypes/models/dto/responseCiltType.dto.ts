import { ApiProperty } from '@nestjs/swagger';

export class ResponseCiltTypeDTO {
  @ApiProperty({ description: 'ID of the CILT type' })
  id: number;

  @ApiProperty({ description: 'Name of the CILT type' })
  name: string;

  @ApiProperty({ description: 'Description of the CILT type' })
  description: string;

  @ApiProperty({ description: 'Status of the CILT type' })
  status: string;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
} 