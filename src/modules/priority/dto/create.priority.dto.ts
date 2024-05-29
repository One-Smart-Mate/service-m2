import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsInt,
  Length,
  MaxLength,
  Min,
} from 'class-validator';

export class CreatePriorityDTO {
  @ApiProperty({
    example: 1,
    description: 'The ID of the company.',
    type: 'number',
  })
  @IsNotEmpty()
  @IsNumber()
  siteId: number;

  @ApiProperty({
    example: '30d',
    description: 'The priority code.',
    type: 'string',
    maxLength: 4,
  })
  @IsNotEmpty()
  @IsString()
  priorityCode: string;

  siteCode?: string;

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

  createdAt?: Date;
}
