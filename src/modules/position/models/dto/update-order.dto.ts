import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class UpdatePositionOrderDTO {
  @ApiProperty({ description: 'Position ID' })
  @IsNumber()
  positionId: number;

  @ApiProperty({ description: 'New order number' })
  @IsNumber()
  @Min(1)
  newOrder: number;
} 