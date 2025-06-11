import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class UpdateOplDetailOrderDTO {
  @ApiProperty({ description: 'OPL Detail ID' })
  @IsNumber()
  detailId: number;

  @ApiProperty({ description: 'New order number' })
  @IsNumber()
  @Min(1)
  newOrder: number;
} 