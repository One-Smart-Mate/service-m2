import { ApiProperty } from '@nestjs/swagger';

export class ResponseRepositoryDTO {
  @ApiProperty({ description: 'ID of the repository' })
  id: number;

  @ApiProperty({ description: 'Name of the repository' })
  name: string;

  @ApiProperty({ description: 'Description of the repository' })
  description: string;

  @ApiProperty({ description: 'URL of the repository' })
  url: string;

  @ApiProperty({ description: 'Type of the repository' })
  type: string;

  @ApiProperty({ description: 'Status of the repository' })
  status: string;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
} 