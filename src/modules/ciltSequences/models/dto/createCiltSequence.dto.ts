import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateCiltSequenceDTO {
  @ApiProperty({ description: 'ID of the CILT' })
  @IsNotEmpty()
  @IsNumber()
  ciltId: number;

  @ApiProperty({ description: 'Number of the sequence' })
  @IsNotEmpty()
  @IsNumber()
  sequenceNumber: number;

  @ApiProperty({ description: 'Description of the sequence' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ description: 'Status of the sequence', default: 'A' })
  @IsNotEmpty()
  @IsString()
  status: string;
} 