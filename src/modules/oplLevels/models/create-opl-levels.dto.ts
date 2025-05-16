import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreateOplLevelsDTO {
  @ApiProperty({ description: 'ID del OPL', example: 1 })
  @IsNotEmpty()
  @IsNumber()
  oplId: number;

  @ApiProperty({ description: 'ID del Nivel', example: 1 })
  @IsNotEmpty()
  @IsNumber()
  levelId: number;
} 