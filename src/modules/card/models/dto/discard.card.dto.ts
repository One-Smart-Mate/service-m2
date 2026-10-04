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
    description: 'Deprecated and ignored. The authenticated user is used.',
    example: 123,
    required: false,
    deprecated: true,
  })
  @IsOptional()
  @IsInt()
  managerId?: number;

  @ApiProperty({
    description: 'Deprecated and ignored. The authenticated user is used.',
    example: 'John Smith',
    required: false,
    deprecated: true,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  managerName?: string;

  @ApiProperty({
    description: 'Deprecated and ignored. The server commit time is used.',
    example: '2024-01-15T10:30:00Z',
    required: false,
    deprecated: true,
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
