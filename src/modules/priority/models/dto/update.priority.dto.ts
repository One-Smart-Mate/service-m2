import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdatePriorityDTO {
  @ApiProperty({
    example: 1,
    description: 'The ID of the priority.',
    type: 'number',
  })
  @IsNotEmpty()
  @IsNumber()
  id: number;

  @ApiProperty({
    example: '30d',
    description: 'The priority code.',
    type: 'string',
    maxLength: 4,
  })
  @IsNotEmpty()
  @IsString()
  priorityCode: string;

  @ApiProperty({
    example: '15 días',
    description: 'The description of the priority.',
    type: 'string',
    maxLength: 50,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  priorityDescription: string;

  @ApiProperty({
    example: 30,
    description: 'The number of days associated with the priority.',
    type: 'number',
  })
  @IsNotEmpty()
  @IsInt()
  @Min(0)
  priorityDays: number;

  @ApiProperty({
    description: 'Status',
    required: true,
    minimum: 1,
  })
  @IsNotEmpty()
  @IsString()
  @IsIn(['A', 'I'])
  status: string;

  updatedAt?: Date;
}
