import { ApiProperty } from '@nestjs/swagger';
import {
  IsISO8601,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateAmDiscardReasonDto {
  @ApiProperty({
    description: 'The ID of the discard reason',
    example: 1,
  })
  @IsNotEmpty()
  @IsInt()
  id: number;

  @ApiProperty({
    description:
      'The site this reason belongs to. If null, it is a global reason.',
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
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(45)
  discardReason?: string;

  @ApiProperty({
    description: 'Update date in ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)',
    default: '2023-06-20T00:00:00.000Z',
  })
  @IsISO8601()
  updatedAt: string;
} 