import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsEnum, IsString, IsOptional } from 'class-validator';

export class CreateOplDetailsDTO {
  @ApiProperty({ description: 'ID of the OPL' })
  @IsNotEmpty()
  @IsNumber()
  oplId: number;

  @ApiProperty({ description: 'Order of the detail' })
  @IsNotEmpty()
  @IsNumber()
  order: number;

  @ApiProperty({ description: 'Type of content', enum: ['texto', 'imagen', 'video', 'pdf'] })
  @IsNotEmpty()
  @IsEnum(['texto', 'imagen', 'video', 'pdf'])
  type: 'texto' | 'imagen' | 'video' | 'pdf';

  @ApiProperty({ description: 'Text content', required: false })
  @IsOptional()
  @IsString()
  text?: string;

  @ApiProperty({ description: 'URL of the media content', required: false })
  @IsOptional()
  @IsString()
  mediaUrl?: string;
} 