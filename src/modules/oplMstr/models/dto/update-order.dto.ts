import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class UpdateOplMstrOrderDTO {
  @ApiProperty({ description: 'OPL ID' })
  @IsNumber()
  oplId: number;

  @ApiProperty({ description: 'New order number' })
  @IsNumber()
  @Min(1)
  newOrder: number;
} 