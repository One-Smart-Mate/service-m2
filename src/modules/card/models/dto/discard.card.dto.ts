import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  IsDateString,
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

  @ApiProperty({
    description: 'The ID of the manager who is discarding the card.',
    example: 123,
    required: false,
  })
  @IsOptional()
  @IsInt()
  managerId?: number;

  @ApiProperty({
    description: 'The name of the manager who is discarding the card.',
    example: 'John Smith',
    required: false,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  managerName?: string;

  @ApiProperty({
    description: 'The date when the manager closed/discarded the card.',
    example: '2024-01-15T10:30:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  cardManagerCloseDate?: string;

  @ApiProperty({
    description: 'Comments from the manager at the time of card closure/discard.',
    example: 'Reviewed and confirmed as duplicate issue.',
    required: false,
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  commentsManagerAtCardClose?: string;
} 