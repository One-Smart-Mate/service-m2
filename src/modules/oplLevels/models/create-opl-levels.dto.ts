import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreateOplLevelsDTO {
  @ApiProperty({ description: 'Opl ID', example: 1 })
  @IsNotEmpty()
  @IsNumber()
  oplId: number;

  @ApiProperty({ description: 'Level ID', example: 1 })
  @IsNotEmpty()
  @IsNumber()
  levelId: number;
} 