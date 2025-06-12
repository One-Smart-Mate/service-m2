import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class UpdateScheduleOrderDTO {
  @ApiProperty({ description: 'Schedule ID' })
  @IsNumber()
  scheduleId: number;

  @ApiProperty({ description: 'New order number' })
  @IsNumber()
  @Min(1)
  newOrder: number;
} 