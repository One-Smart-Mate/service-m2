import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class UpdateCiltOrderDTO {
  @ApiProperty({ description: 'CILT Master ID' })
  @IsNumber()
  ciltMstrId: number;

  @ApiProperty({ description: 'New order number' })
  @IsNumber()
  @Min(1)
  newOrder: number;
} 