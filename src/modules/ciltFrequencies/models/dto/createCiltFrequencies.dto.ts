import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsISO8601 } from 'class-validator';

export class CreateCiltFrequenciesDTO {
  @ApiProperty({ description: 'Site ID', required: false })
  @IsOptional()
  @IsNumber()
  siteId?: number;

  @ApiProperty({ description: 'Frequency code (IT=Start of shift, FT=End of shift, CP=Format change, RUN=Machine running)', required: false })
  @IsOptional()
  @IsString()
  frecuencyCode?: string;

  @ApiProperty({ description: 'Frequency description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Frequency status', required: false, default: 'A' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ description: 'Schedule', required: false })
  @IsOptional()
  @IsNumber()
  schedule?: number;

  @ApiProperty({ description: 'Creation date in ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)', default: '2023-06-20T00:00:00.000Z' })
  @IsISO8601()
  createdAt: string;
} 