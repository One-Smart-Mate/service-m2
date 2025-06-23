import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateAmDiscardReasonDto {
  @ApiProperty({
    description: 'The site this reason belongs to. If null, it is a global reason.',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt()
  siteId?: number;

  @ApiProperty({
    description: 'Reason for discarding a card.',
    example: 'Duplicated card',
    maxLength: 45,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(45)
  discardReason: string;
} 