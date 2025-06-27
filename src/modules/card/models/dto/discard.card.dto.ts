import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class DiscardCardDto {
  @ApiProperty({
    description: 'The ID of the card to discard',
    example: 1,
  })
  @IsNotEmpty()
  @IsInt()
  cardId: number;

  @ApiProperty({
    description: 'The ID of the predefined discard reason.',
    example: 1,
  })
  @IsNotEmpty()
  @IsInt()
  amDiscardReasonId: number;

  @ApiProperty({
    description: 'An optional comment about why the card is being discarded.',
    example: 'User confirmed this is a duplicate.',
    required: false,
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  discardReason?: string;
} 