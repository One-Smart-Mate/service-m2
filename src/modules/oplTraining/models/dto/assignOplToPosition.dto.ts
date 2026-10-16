import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

export class AssignOplToPositionDTO {
  @ApiProperty({ description: 'OPL (course) id', example: 12 })
  @IsInt()
  @IsPositive()
  oplId: number;

  @ApiProperty({ description: 'Position id the OPL is required for', example: 3 })
  @IsInt()
  @IsPositive()
  positionId: number;
}
