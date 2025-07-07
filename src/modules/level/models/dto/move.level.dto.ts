import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class MoveLevelDto {
  @ApiProperty({
    description: 'Level ID',
    example: 1,
    required: true,
  })
  @IsNotEmpty()
  @IsNumber()
  levelId: number;

  @ApiProperty({
    description: 'New superior ID',
    example: 2,
    required: true,
  })
  @IsNotEmpty()
  @IsNumber()
  newSuperiorId: number;
} 