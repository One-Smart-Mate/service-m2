import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateCiltSequencesFrequenciesDTO {
  @ApiProperty({ description: 'ID of the CILT sequence' })
  @IsNotEmpty()
  @IsNumber()
  ciltSecuenceId: number;

  @ApiProperty({ description: 'ID of the frequency' })
  @IsNotEmpty()
  @IsNumber()
  frecuencyId: number;

  @ApiProperty({ description: 'Status of the frequency', default: 'A' })
  @IsNotEmpty()
  @IsString()
  status: string;
} 