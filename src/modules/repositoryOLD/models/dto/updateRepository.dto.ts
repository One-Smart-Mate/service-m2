import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsOptional, IsUrl } from 'class-validator';

export class UpdateRepositoryDTO {
  @ApiProperty({ description: 'ID of the repository' })
  @IsNotEmpty()
  @IsNumber()
  id: number;

  @ApiProperty({ description: 'Name of the repository' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Description of the repository' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'URL of the repository' })
  @IsOptional()
  @IsUrl()
  url?: string;

  @ApiProperty({ description: 'Type of the repository' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({ description: 'Status of the repository' })
  @IsOptional()
  @IsString()
  status?: string;
} 