import { ApiProperty } from '@nestjs/swagger';

export class ResponseCiltTypeDTO {
  @ApiProperty({ description: 'ID of the CILT type' })
  id: number;

  @ApiProperty({ description: 'Site ID' })
  siteId: number;

  @ApiProperty({ description: 'Name of the CILT type' })
  name: string;

  @ApiProperty({ description: 'Status of the CILT type' })
  status: string;
} 