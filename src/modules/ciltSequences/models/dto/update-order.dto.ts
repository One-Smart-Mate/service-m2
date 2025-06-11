import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class UpdateSequenceOrderDTO {
  @ApiProperty({ description: 'Sequence ID' })
  @IsNumber()
  sequenceId: number;

  @ApiProperty({ description: 'New order number' })
  @IsNumber()
  @Min(1)
  newOrder: number;
} 