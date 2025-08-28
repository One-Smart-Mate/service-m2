import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive } from 'class-validator';

export class GenerateCiltSequencesExecutionDTO {
  @ApiProperty({
    description: 'ID of the CILT sequence to generate execution from',
    example: 1
  })
  @IsNumber()
  @IsPositive()
  sequenceId: number;

  @ApiProperty({
    description: 'ID of the user generating the execution',
    example: 1
  })
  @IsNumber()
  @IsPositive()
  userId: number;
}