import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber } from 'class-validator';

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
} 