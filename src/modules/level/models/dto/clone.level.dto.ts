import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class CloneLevelDto {
  @ApiProperty({
    description: 'Level ID to clone',
    example: 1,
    required: true,
  })
  @IsNotEmpty()
  @IsNumber()
  levelId: number;
}
