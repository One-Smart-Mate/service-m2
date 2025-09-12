import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsString } from 'class-validator';

export class CreateCiltSequencesFrequenciesDTO {
  @ApiProperty({ description: 'Site ID', required: false })
  @IsOptional()
  @IsNumber()
  siteId?: number;

  @ApiProperty({ description: 'Position ID', required: false })
  @IsOptional()
  @IsNumber()
  positionId?: number;

  @ApiProperty({ description: 'CILT ID', required: false })
  @IsOptional()
  @IsNumber()
  ciltId?: number;

  @ApiProperty({ description: 'Sequence ID', required: false })
  @IsOptional()
  @IsNumber()
  secuencyId?: number;

  @ApiProperty({ description: 'Frequency ID', required: false })
  @IsOptional()
  @IsNumber()
  frecuencyId?: number;

  @ApiProperty({ description: 'Frequency code', default: 'IT', required: false })
  @IsOptional()
  @IsString()
  frecuencyCode?: string;

  @ApiProperty({ description: 'Status', required: false, default: 'A' })
  @IsOptional()
  @IsString()
  status?: string;
} 