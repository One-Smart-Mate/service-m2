import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';

export class UpdateCiltFrequenciesDTO {
  @ApiProperty({ description: 'Frequency ID' })
  @IsNotEmpty()
  @IsNumber()
  id: number;

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

  @ApiProperty({ description: 'Frequency status', required: false })
  @IsOptional()
  @IsString()
  status?: string;
} 