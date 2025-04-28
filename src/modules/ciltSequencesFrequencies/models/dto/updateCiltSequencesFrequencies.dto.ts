import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsOptional } from 'class-validator';

export class UpdateCiltSequencesFrequenciesDTO {
  @ApiProperty({ description: 'ID of the frequency' })
  @IsNotEmpty()
  @IsNumber()
  id: number;

  @ApiProperty({ description: 'ID of the CILT sequence' })
  @IsOptional()
  @IsNumber()
  ciltSecuenceId?: number;

  @ApiProperty({ description: 'ID of the frequency' })
  @IsOptional()
  @IsNumber()
  frecuencyId?: number;

  @ApiProperty({ description: 'Status of the frequency' })
  @IsOptional()
  @IsString()
  status?: string;
} 