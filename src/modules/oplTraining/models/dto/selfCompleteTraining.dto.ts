import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

export class SelfCompleteTrainingDTO {
  @ApiProperty({ description: 'OPL (course) id the user took', example: 12 })
  @IsInt()
  @IsPositive()
  oplId: number;
}
