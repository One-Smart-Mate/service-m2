import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsEnum, IsString, IsOptional, IsISO8601 } from 'class-validator';

export class UpdateOplDetailsDTO {
  @ApiProperty({ description: 'ID of the detail' })
  @IsNotEmpty()
  @IsNumber()
  id: number;

  @ApiProperty({ description: 'ID of the OPL', required: false })
  @IsOptional()
  @IsNumber()
  oplId?: number;

  @ApiProperty({ description: 'Order of the detail', required: false })
  @IsOptional()
  @IsNumber()
  order?: number;

  @ApiProperty({ description: 'Type of content', enum: ['texto', 'imagen', 'video', 'pdf'], required: false })
  @IsOptional()
  @IsEnum(['texto', 'imagen', 'video', 'pdf'])
  type?: 'texto' | 'imagen' | 'video' | 'pdf';

  @ApiProperty({ description: 'Text content', required: false })
  @IsOptional()
  @IsString()
  text?: string;

  @ApiProperty({ description: 'URL of the media content', required: false })
  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @ApiProperty({ description: 'Update date in ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)', default: '2023-06-20T00:00:00.000Z' })
  @IsISO8601()
  updatedAt: string;
} 