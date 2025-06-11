import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUrl, IsOptional } from 'class-validator';

export class CreateRepositoryDTO {
  @ApiProperty({ description: 'Name of the repository' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Description of the repository' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'URL of the repository' })
  @IsNotEmpty()
  @IsUrl()
  url: string;

  @ApiProperty({ description: 'Type of the repository' })
  @IsNotEmpty()
  @IsString()
  type: string;

  @ApiProperty({ description: 'Status of the repository', default: 'A' })
  @IsNotEmpty()
  @IsString()
  status: string;
} 