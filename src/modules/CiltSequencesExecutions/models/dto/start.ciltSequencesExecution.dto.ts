import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsISO8601 } from 'class-validator';

export class StartCiltSequencesExecutionDTO {
  @ApiProperty({ description: 'Execution ID', default: 1 })
  @IsNotEmpty()
  @IsNumber()
  id: number;

  @ApiProperty({ type: 'string', format: 'date-time', example: '2023-06-20T00:00:00.000Z' })
  @IsNotEmpty()
  @IsISO8601()
  startDate: string;
}